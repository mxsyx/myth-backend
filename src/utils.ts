import { type ZodSchema } from "zod";
import type { Next, ValidationTargets } from "hono";
import { getCookie } from "hono/cookie";

/**
 * Middleware function to validate request data against a Zod schema.
 *
 * @param schema - The Zod schema to validate the request data against.
 * @param target - The part of the request to validate. Defaults to "json".
 *                 Can be one of "json", "form", "query", "param", "header", or "cookie".
 * @returns An asynchronous function that processes the request, validates
 *          the specified target data, and passes control to the next
 *          middleware if validation succeeds. If validation fails, it
 *          responds with a 400 status and an error message detailing the issues.
 */

export function Validator(
  schema: ZodSchema,
  target: keyof ValidationTargets = "json"
) {
  return async function (c: C, next: Next) {
    let data: ValidationTargets[typeof target];
    if (target === "json") {
      data = await c.req.json();
    } else if (target === "form") {
      const formData = await c.req.formData();
      data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
    } else if (target === "query") {
      data = c.req.query();
    } else if (target === "param") {
      data = c.req.param();
    } else if (target === "header") {
      data = c.req.header();
    } else if (target === "cookie") {
      data = getCookie(c);
    } else {
      throw new Error("Invalid target");
    }

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return c.json(
        {
          message: parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
        },
        400
      );
    }
    c.req.addValidatedData(target, parsed.data);

    await next();
  };
}
