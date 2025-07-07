import { z } from "zod";
import { createQdrantClient } from "./qdrant";
import { BGEM3OuputEmbedding } from "@cloudflare/workers-types";
import { components } from "@qdrant/js-client-rest/dist/types/openapi/generated_schema";

export const getAssetsSchame = z.object({
  type: z.number({ coerce: true }),
  prompt: z.string().optional(),
  keyword: z.string().optional(),
  cursor: z.number({ coerce: true }).min(1).optional(),
});

export async function getAssets(
  c: C<z.infer<typeof getAssetsSchame>, "query">
) {
  const { type, prompt, keyword, cursor } = c.req.valid("query");

  let vector: number[] | undefined;
  if (prompt) {
    try {
      const output = (await c.env.AI.run("@cf/baai/bge-m3", {
        text: [prompt],
      })) as BGEM3OuputEmbedding;
      if (output.data?.length) {
        vector = output.data[0];
      }
    } catch (error) {
      console.error(error);
    }
  }

  const conditions: components["schemas"]["Filter"]["must"] = [
    {
      key: "type",
      match: { value: type },
    },
  ];
  if (keyword) {
    conditions.push({
      key: "caption",
      match: {
        text: keyword,
      },
    });
  }

  const qdrant = createQdrantClient(c.env);
  if (vector) {
    const { points } = await qdrant.query("myth_assets", {
      with_payload: true,
      limit: 20,
      offset: ((cursor || 1) - 1) * 20,
      query: vector,
      filter: {
        must: conditions,
      },
    });

    return c.json(points);
  } else {
    const { points } = await qdrant.scroll("myth_assets", {
      with_payload: true,
      limit: 20,
      filter: {
        must: conditions,
      },
      order_by: {
        key: "createdAt",
        direction: "desc",
        start_from: cursor,
      },
    });

    return c.json(points);
  }
}
