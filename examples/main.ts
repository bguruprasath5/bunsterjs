import { BunsterServer } from "../src";
import { HttpStatusCode } from "../src/enum";
import { BunsterRouter } from "../src/router";

const router = new BunsterRouter();

router.get("/", (ctx) => {
  ctx.logger.info(`Query: ${JSON.stringify(ctx.query)}`);
  ctx.logger.info(`Meta: ${JSON.stringify(ctx.meta)}`);
  return { status: HttpStatusCode.OK, message: "Hello from Bunster server" };
});

router.middleware((context) => {
  context.meta.userId = 123;
});

router.post("/", ({ query, body, headers, logger }) => {
  logger.info(`Query: ${JSON.stringify(query)}`);
  logger.info(`Body: ${JSON.stringify(body)}`);
  logger.info(`Headers: ${JSON.stringify(headers)}`);
  return { status: HttpStatusCode.BadRequest, message: "Invalid request" };
});

const app = new BunsterServer(router);

app.serve({
  port: 4000,
});
