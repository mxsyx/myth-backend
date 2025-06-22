import { getExtension } from "hono/utils/mime";
import { ONE_MB } from "./constants";
import { z } from "zod";

export const fileKeySchema = z.object({ key: z.string() });
export const fileIdSchema = z.object({ id: z.string() });

function validImage(file: File) {
  if (file.size > 10 * ONE_MB) {
    return "Size shouldn't be more `than` 10 MB";
  }
  return null;
}

/**
 * Handles the upload of a file to R2 storage.
 * @description This function extracts a file from the request's form data, validates its type and size, and uploads it to a temporary R2 storage location.
 * If the file is not provided or invalid, a JSON response with an error message is returned.
 * @param c - Hono context object
 * @returns JSON response containing the uploaded file's information, including a unique ID, fileName, size, and type.
 * If an error occurs, a JSON response with an error message and status code 400 is returned.
 */
export async function uploadFileToR2(c: C) {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return c.json(
      {
        message: "File is required",
      },
      400
    );
  }

  let message = validImage(file);
  const customMetadata: Dict<string> = {};
  if (file.type.startsWith("image/")) {
    message = validImage(file);
    customMetadata.width = formData.get("width") as string;
    customMetadata.height = formData.get("height") as string;
    customMetadata.thumbhash = formData.get("thumbhash") as string;
  } else {
    message = "Not supported file type";
  }

  if (message) {
    return c.json({ message }, 400);
  }

  const blob = await file.arrayBuffer();
  const uuid = crypto.randomUUID();
  const key = `${file.type.split("/")[0]}/${uuid}.${getExtension(file.type)}`;
  customMetadata.id = uuid;

  await c.env.R2_ASSETS_TMP.put(key, blob, {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata,
  });

  return c.json({
    id: uuid,
    key,
    metadata: customMetadata,
  });
}
