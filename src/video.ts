import { type BGEM3OuputEmbedding } from "@cloudflare/workers-types";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { createQdrantClient } from "./qdrant";
import { AssetTypeEnum } from "./types";

export const createVideoAssetSchema = z.object({
  key: z.string(),
  caption: z.string(),
  tags: z.array(z.string()).default([]),
  posterKey: z.string(),
});

/**
 * Creates an video asset.
 * @description This endpoint takes an video and caption in the request body and creates an asset.
 * The video is uploaded to R2 and the caption is processed with the Baai M3 model to generate an embedding.
 * The embedding is then inserted into the vector store.
 * @param c - Hono context object
 * @returns Information about the uploaded video
 */
export async function createVideoAsset(
  c: C<z.infer<typeof createVideoAssetSchema>>
) {
  const { key, caption, tags, posterKey } = c.req.valid("json");
  const file = await c.env.R2_ASSETS_TMP.get(key);
  const posterFile = await c.env.R2_ASSETS_TMP.get(posterKey);
  if (!file || !file.customMetadata?.id) {
    return c.json({ message: "File not found" }, 404);
  }
  if (!posterFile || !posterFile.customMetadata?.id) {
    return c.json({ message: "Poster not found" }, 404);
  }

  // Run the Baai M3 model on the caption to generate an embedding
  const output = (await c.env.AI.run("@cf/baai/bge-m3", {
    text: [caption],
  })) as BGEM3OuputEmbedding;
  const qdrant = createQdrantClient(c.env);
  if (output.data?.length) {
    // Insert the generated embedding into the vector store
    // The vector store is used to efficiently search for videos that match the caption
    await qdrant.upsert("myth_assets", {
      points: [
        {
          // The ID of the video is used as the key in the vector store
          id: file.customMetadata.id,
          // The caption is stored as metadata in the vector store
          payload: {
            url: `/${key}?w=${file.customMetadata.width}&h=${file.customMetadata.height}&duration=${file.customMetadata.duration}`,
            caption,
            tags,
            type: AssetTypeEnum.VIDEO,
            poster: `/${posterKey}?w=${posterFile.customMetadata.width}&h=${posterFile.customMetadata.height}&thumbhash=${posterFile.customMetadata.thumbhash}`,
            createdAt: Date.now(),
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

    // Move the poster to the final location
    await c.env.R2_ASSETS.put(posterKey, await posterFile.arrayBuffer(), {
      httpMetadata: posterFile.httpMetadata,
      customMetadata: posterFile.customMetadata,
    });
  } catch (e) {
    // If there's an error, delete the file from the vector store
    // This is necessary because the file might be partially uploaded, and we don't want to leave it in the vector store
    await qdrant.delete("myth_assets", {
      points: [file.customMetadata.id],
    });
    throw new HTTPException(500, {
      message: "An error occurred when uploading the video",
    });
  }

  return c.json({});
}
