import { type BGEM3OuputEmbedding } from "@cloudflare/workers-types";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { createQdrantClient } from "./qdrant";
import { AssetTypeEnum } from "./types";

export const createAudioAssetSchema = z.object({
  key: z.string(),
  caption: z.string(),
  tags: z.array(z.string()).default([]),
});

/**
 * Creates an audio asset.
 * @description This endpoint takes an audio and caption in the request body and creates an asset.
 * The audio is uploaded to R2 and the caption is processed with the Baai M3 model to generate an embedding.
 * The embedding is then inserted into the vector store.
 * @param c - Hono context object
 * @returns Information about the uploaded audio
 */
export async function createAudioAsset(
  c: C<z.infer<typeof createAudioAssetSchema>>
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
    // The vector store is used to efficiently search for audios that match the caption
    await qdrant.upsert("myth_assets", {
      points: [
        {
          // The ID of the audio is used as the key in the vector store
          id: file.customMetadata.id,
          // The caption is stored as metadata in the vector store
          payload: {
            url: `/${key}?duration=${file.customMetadata.duration}`,
            caption,
            tags,
            type: AssetTypeEnum.AUDIO,
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
    await c.env.R2_ASSETS.put(key, await file.arrayBuffer());
  } catch (e) {
    // If there's an error, delete the file from the vector store
    // This is necessary because the file might be partially uploaded, and we don't want to leave it in the vector store
    await qdrant.delete("myth_assets", {
      points: [file.customMetadata.id],
    });
    throw new HTTPException(500, {
      message: "An error occurred when uploading the audio",
    });
  }

  return c.json({});
}
