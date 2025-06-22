import { z } from "zod";
import { createQdrantClient } from "./qdrant";

export const getAssetsSchame = z.object({
  page: z.number().min(1).default(1),
});

export async function getAssets(
  c: C<z.infer<typeof getAssetsSchame>, "query">
) {
  const { page } = c.req.valid("query");

  const qdrant = createQdrantClient(c.env);
  const { points } = await qdrant.query("myth_assets", {
    with_payload: true,
    limit: 20,
    offset: (page - 1) * 20,
  });

  return c.json(points);
}
