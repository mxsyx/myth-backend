import { type BGEM3OuputEmbedding } from "@cloudflare/workers-types";
import { z } from "zod";
import { fileKeySchema } from "./file";
import { HTTPException } from "hono/http-exception";
import { createQdrantClient } from "./qdrant";
import { AssetTypeEnum } from "./types";

export const createImageAssetSchame = z.object({
  key: z.string(),
  caption: z.string(),
  tags: z.array(z.string()).default([]),
});

/**
 * Generate a caption for the image provided in the request body.
 * @description This endpoint takes an image in the request body and returns a generated caption.
 * @param c - Hono context object
 * @returns Generated caption
 */
export async function generateImageCaption(
  c: C<z.infer<typeof fileKeySchema>>
) {
  const { key } = c.req.valid("json");
  const file = await c.env.R2_ASSETS_TMP.get(key);
  if (!file) {
    return c.json({ message: "File not found" }, 404);
  }
  const blob = await file.arrayBuffer();

  // Run the Baai M3 model on the image and generate a caption
  const { description } = await c.env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
    image: [...new Uint8Array(blob)],
    prompt: "Generate a caption for this image",
    max_tokens: 512,
  });

  return c.json({ caption: description.trim() });
}

/**
 * Creates an image asset.
 * @description This endpoint takes an image and caption in the request body and creates an asset.
 * The image is uploaded to R2 and the caption is processed with the Baai M3 model to generate an embedding.
 * The embedding is then inserted into the vector store.
 * @param c - Hono context object
 * @returns Information about the uploaded image
 */
export async function createImageAsset(
  c: C<z.infer<typeof createImageAssetSchame>>
) {
  const { key, caption, tags } = c.req.valid("json");
  const file = await c.env.R2_ASSETS_TMP.get(key);
  if (!file || !file.customMetadata?.id) {
    return c.json({ message: "File not found" }, 404);
  }

  // Run the Baai M3 model on the caption to generate an embedding
  const output = (await c.env.AI.run("@cf/baai/bge-m3", {
    text: [caption],
  })) as BGEM3OuputEmbedding;
  const qdrant = createQdrantClient(c.env);
  if (output.data?.length) {
    // Insert the generated embedding into the vector store
    // The vector store is used to efficiently search for images that match the caption
    await qdrant.upsert("myth_assets", {
      points: [
        {
          // The ID of the image is used as the key in the vector store
          id: file.customMetadata.id,
          // The caption is stored as metadata in the vector store
          payload: {
            url: `/${key}?w=${file.customMetadata.width}&h=${file.customMetadata.height}&thumbhash=${file.customMetadata.thumbhash}`,
            caption,
            tags,
            type: AssetTypeEnum.IMAGE,
          },
          // The generated embedding is stored in the vector store
          vector: output.data[0],
        },
      ],
    });
  }

  try {
    // Move the file to the final location
    // This is necessary because R2 doesn't allow you to upload directly to the final location
    // We need to upload to the temporary location first, and then move it.
    await c.env.R2_ASSETS.put(key, await file.arrayBuffer(), {
      httpMetadata: file.httpMetadata,
      customMetadata: file.customMetadata,
    });
  } catch (e) {
    // If there's an error, delete the file from the vector store
    // This is necessary because the file might be partially uploaded, and we don't want to leave it in the vector store
    await qdrant.delete("myth_assets", {
      points: [file.customMetadata.id],
    });
    throw new HTTPException(500, {
      message: "An error occurred when uploading the image",
    });
  }

  return c.json({});
}
