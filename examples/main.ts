import { z } from "zod";
import { Bunster, CronExpression, HttpStatus } from "../dist/";

const xPoweredBy = "benchmark";
const inputSchema = {
  query: z.object({
    name: z.string(),
  }),
  params: z.object({
    id: z.coerce.number(),
  }),
};
const app = new Bunster();

app
  .get({
    path: "/",
    handler: (ctx) => ctx.sendText("Hi"),
  })
  .post({
    path: "/json",
    handler: (ctx) => ctx.sendJson(ctx.body),
  })
  .get({
    path: "/id/:id",
    input: inputSchema,
    handler: (ctx) => {
      return ctx.sendText(`${ctx.params?.id} ${ctx.query?.name}`, {
        headers: {
          "x-powered-by": xPoweredBy,
        },
      });
    },
  });

app.serve({
  port: 3000,
  loggerConfig: {
    logRequest: false,
  },
});
