import type { ValidationTargets, Context } from "hono";
import type { Ai, R2Bucket } from "@cloudflare/workers-types";

export interface Bindings {
  AI: Ai;
  R2_ASSETS: R2Bucket;
  R2_ASSETS_TMP: R2Bucket;

  // Qdrant
  QDRANT_URL: string;
  QDRANT_API_KEY: string;
}

declare global {
  type Dict<T = any> = Record<string, T>;

  type C<
    T extends Dict = never,
    R extends keyof ValidationTargets = T extends never ? never : "json"
  > = Context<
    {
      Bindings: Bindings;
    },
    any,
    { out: { [K in R]: T } }
  >;
}

export const AssetTypeEnum = {
  IMAGE: 1,
  VIDEO: 2,
  AUDIO: 3,
} as const;
