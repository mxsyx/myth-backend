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

const app = new Hono();

app.use("*", logger());
app.use("*", poweredBy());

const v1App = new Hono<{ Bindings: Bindings }>();

v1App.get("/", (c) => c.text("Hello Hono!"));

v1App.post("/files", uploadFileToR2);
v1App.post("/image/captions", Validator(fileKeySchema), generateImageCaption);
v1App.post("/images", Validator(createImageAssetSchame), createImageAsset);
v1App.get("/images", Validator(searchImageSchame, "query"), searchImage);

app.route("/v1", v1App);

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ message: "Internal Server Error" }, 500);
});

app.notFound((c) => {
  return c.json({ message: "Not Found" }, 404);
});

export default app;
