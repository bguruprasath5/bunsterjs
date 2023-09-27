import { z, ZodSchema } from "zod";
import {
  Middleware,
  Route,
  RouteContext,
  RouteHandler,
  RouteOutput,
  ServeOptions,
} from "./types";
import { HttpError } from "./error";
import { HttpStatus } from "./http-status.enum";
import { parseAndValidate } from "./validator";
import BunsterLogger from "./logger";
import { BunsterJwt } from "./jwt";
import { BunsterMail } from "./mail";
import { BunsterDateTime } from "./datetime";
import { CronExpression } from "./cron-expression.enum";
import { Scheduler } from "./scheduler";

function route<Input>(input?: ZodSchema<Input, z.ZodTypeDef, any>) {
  function handle<Output extends RouteOutput>(
    handler: RouteHandler<Input, Output>,
    middlewares: Middleware[] = []
  ): Route<Input, Output> {
    return {
      input,
      handler,
      middlewares,
    };
  }
  return {
    handle,
  };
}

class Bunster {
  #logger: BunsterLogger;
  #scheduler: Scheduler;
  constructor(private readonly routes: { [key: string]: Route } = {}) {
    this.#logger = new BunsterLogger();
    this.#scheduler = new Scheduler();
  }

  private sendError(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    return Response.json({ message }, { status });
  }

  private async handle(request: Request): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname !== "/") {
      return this.sendError("Not found", HttpStatus.NOT_FOUND);
    }

    let query = Object.fromEntries(searchParams.entries());
    const route = this.routes[query["action"]];
    console.log(query);

    if (!route) {
      return this.sendError("Not found", HttpStatus.NOT_FOUND);
    }

    try {
      const input = route.input
        ? await parseAndValidate(
            request.body ? await request.json() : {},
            route.input
          )
        : undefined;
      let context: RouteContext = {
        input,
        headers: request.headers,
        log: (message: string) => {
          this.#logger.log(message);
        },
        meta: {},
      };

      // Execute middlewares
      for (const middleware of route.middlewares) {
        await middleware(context);
      }

      return await route.handler(context);
    } catch (error) {
      if (error instanceof HttpError) {
        return this.sendError(error.message, error.status);
      } else {
        return this.sendError(error?.toString() ?? "An error occurred");
      }
    }
  }

  schedule(cronExpression: CronExpression, taskFunction: () => void) {
    this.#scheduler.schedule(cronExpression, taskFunction);
  }

  listen(options: ServeOptions) {
    const server = Bun.serve({
      ...options,
      fetch: async (request) => {
        if (request.method === "POST") {
          return Response.json(await this.handle(request));
        } else {
          return this.sendError("not found", HttpStatus.NOT_FOUND);
        }
      },
    });
    console.log(
      `🚀 Bunster server started at http://${server.hostname}:${server.port}`
    );
    return server;
  }
}

export {
  Bunster,
  route,
  BunsterJwt,
  BunsterMail,
  HttpError,
  HttpStatus,
  BunsterDateTime,
};
