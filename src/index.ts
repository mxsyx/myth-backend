import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";

import { Bindings } from "./types";
import {
  createImageAsset,
  createImageAssetSchame,
  generateImageCaption,
  searchImage,
  searchImageSchame,
} from "./image";
import { Validator } from "./utils";
import { fileKeySchema, uploadFileToR2 } from "./file";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", logger());
app.use("*", poweredBy());

app.get("/", (c) => c.text("Hello Hono!"));

app.post("/files", uploadFileToR2);
app.post("/image/captions", Validator(fileKeySchema), generateImageCaption);
app.post("/images", Validator(createImageAssetSchame), createImageAsset);
app.get("/images", Validator(searchImageSchame, "query"), searchImage);

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ message: "Internal Server Error" }, 500);
});

app.notFound((c) => {
  return c.json({ message: "Not Found" }, 404);
});

export default app;
