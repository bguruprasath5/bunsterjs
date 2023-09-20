import { z } from "zod";
import { Bunster } from "../src";
import userRouteGroup from "./user.route";
import { CronExpression } from "../src/cron-expression.enum";

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

app.mount({ path: "/", routeGroup: userRouteGroup });

app.get({
  path: "/",
  handler: (ctx) => ctx.sendText("Hi"),
});

app.post({
  path: "/json",
  handler: (ctx) => ctx.sendJson(ctx.body),
});

app.get({
  path: "/id/:id",
  input: inputSchema,
  handler: (ctx) => {
    ctx.setHeader("x-powered-by", xPoweredBy);
    return ctx.sendText(`${ctx.params.id} ${ctx.query.name}`);
  },
});

app.schedule({
  id: "task#1",
  cronExpression: CronExpression.EVERY_10_SECONDS,
  task: ({ log }) => {
    log("info", "scheduler started");
    log("info", "hi from scheduler");
    log("info", "scheduler ended");
  },
});

app.serve({
  port: 4000,
});
