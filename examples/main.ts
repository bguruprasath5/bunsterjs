import { z } from "zod";
import { Bunster } from "../src";

const xPoweredBy = "benchmark";

const app = new Bunster();

app.get("/", (ctx) => ctx.sendText("Hi"));

app.post("/json", (ctx) => ctx.sendJson(ctx.body));

const inputSchema = {
  query: z.object({
    name: z.string(),
  }),
  params: z.object({
    id: z.coerce.number(),
  }),
};

app.get(
  "/id/:id",
  (ctx) => {
    ctx.setHeader("x-powered-by", xPoweredBy);
    return ctx.sendText(`${ctx.params.id} ${ctx.query.name}`);
  },
  {
    input: inputSchema,
  }
);

app.serve({
  port: 4000,
});
