import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { cors } from "hono/cors";

import { Bindings } from "./types";
import {
  createImageAsset,
  createImageAssetSchame,
  generateImageCaption,
} from "./image";
import { Validator } from "./utils";
import { fileKeySchema, getFileFromR2, uploadFileToR2 } from "./file";
import { getAssets, getAssetsSchame } from "./asset";
import { createVideoAsset, createVideoAssetSchema } from "./video";
import { createAudioAsset, createAudioAssetSchema } from "./audio";

const app = new Hono();

app.use("*", logger());
app.use("*", poweredBy());
app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    maxAge: 3600 * 24,
    credentials: true,
  })
);

const v1App = new Hono<{ Bindings: Bindings }>();

v1App.get("/", (c) => c.text("Hello Hono!"));

v1App.post("/files", uploadFileToR2);
v1App.get("/files/:key{.*}", getFileFromR2);
v1App.post("/image/captions", Validator(fileKeySchema), generateImageCaption);
v1App.post("/images", Validator(createImageAssetSchame), createImageAsset);
v1App.post("/videos", Validator(createVideoAssetSchema), createVideoAsset);
v1App.post("/audios", Validator(createAudioAssetSchema), createAudioAsset);

v1App.get("/assets", Validator(getAssetsSchame, "query"), getAssets);

app.route("/v1", v1App);

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ message: err.message || "Internal Server Error" }, 500);
});

app.notFound((c) => {
  return c.json({ message: "Not Found" }, 404);
});

export default app;
