import { QdrantClient } from "@qdrant/js-client-rest";

import { Bindings } from "./types";

export function createQdrantClient(env: Bindings) {
  return new QdrantClient({
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
    checkCompatibility: false,
  });
}
