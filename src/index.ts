import { Hono } from "hono";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";

const app = new Hono();

app.use("*", logger());
app.use("*", poweredBy());

app.get("/", (c) => c.text("Hello Hono!"));

app.get("/greet/:name", (c) => {
  const name = c.req.param("name");
  return c.json({ message: `Hello, ${name}!` });
});

app.post("/api/data", async (c) => {
  const body = await c.req.json();
  return c.json({
    received: body,
  });
});

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

export default app;
