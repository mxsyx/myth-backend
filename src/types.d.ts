import type { ValidationTargets, Context } from "hono";
import type { Ai, R2Bucket, Vectorize } from "@cloudflare/workers-types";

export interface Bindings {
  AI: Ai;
  R2_ASSETS: R2Bucket;
  R2_ASSETS_TMP: R2Bucket;
  VECTORIZE: Vectorize;
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
