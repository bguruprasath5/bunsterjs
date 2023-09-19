import { BunsterContext, HttpMethod, ServeOptions } from "./types";
import { Server } from "bun";
import BunsterLogger from "./logger";
import { HttpStatusCode } from "./enum";
import { BunsterRouter } from "./router";

export class BunsterServer<T> {
  #router: BunsterRouter;

  constructor(router: BunsterRouter) {
    this.#router = router;
  }

  private async fetch(request: Request, logger: BunsterLogger) {
    const context: BunsterContext = {
      query: {},
      params: {},
      body: {},
      meta: {},
      headers: request.headers,
      logger,
    };
    const { pathname, searchParams } = new URL(request.url);

    const matched = this.#router.lookup(pathname, request.method as HttpMethod);

    if (!matched) {
      return this.sendJson({ message: "Not found" }, HttpStatusCode.NotFound);
    }

    context.params = matched.params || {};

    searchParams.forEach((value, key) => {
      context.query[key] = value;
    });

    if (request.body) {
      try {
        context.body = await request.json();
      } catch (error) {
        this.sendError("invalid json body");
      }
    }

    try {
      for (const middleware of this.#router.middlewares) {
        await middleware(context);
      }
      const bunliteResponse = await matched.handler(context);
      return bunliteResponse instanceof Error
        ? this.sendError(bunliteResponse.message)
        : this.sendJson(
            {
              message: bunliteResponse.message,
              data: bunliteResponse.data,
            },
            bunliteResponse.status || HttpStatusCode.OK
          );
    } catch (error) {
      logger.error(`${error}`);
      return this.sendError(error?.toString() ?? "An error occurred");
    }
  }

  private sendJson(data: any, status: HttpStatusCode = HttpStatusCode.OK) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  private sendError(
    message: string,
    status: HttpStatusCode = HttpStatusCode.InternalServerError
  ) {
    return this.sendJson({ message }, status);
  }

  /**
   * @param options Bun server options
   * @param cb Server callback after server starts listening
   */
  serve(options: ServeOptions, cb?: (server: Server) => void) {
    const server = Bun.serve({
      ...options,
      fetch: async (request) => {
        return await this.fetch(request, new BunsterLogger());
      },
    });
    console.log(
      `🚀 Bunster server started at http://${server.hostname}:${server.port}`
    );
    cb?.(server);

    return server;
  }
}
