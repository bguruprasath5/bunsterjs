import { z, ZodSchema } from "zod";
import {
  Middleware,
  Route,
  RouteContext,
  RouteHandler,
  RouteOutput,
  SchedulerContext,
  ServeOptions,
} from "./types";
import {
  BadRequestError,
  HttpError,
  InternalServerError,
  UnauthorizedError,
} from "./error";
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

function createRouter(middlewares: Middleware[] = []) {
  function routes<T extends { [key: string]: Route }>(inputRoutes: T): T {
    const routes: T = { ...inputRoutes };
    for (let routeKey in routes) {
      routes[routeKey].middlewares = [
        ...middlewares,
        ...(routes[routeKey].middlewares || []),
      ];
    }
    return routes;
  }
  return { routes };
}

class Bunster {
  #logger: BunsterLogger;
  #scheduler: Scheduler;
  static headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  constructor(private readonly routes: { [key: string]: Route } = {}) {
    this.#logger = new BunsterLogger();
    this.#scheduler = new Scheduler();
  }

  private sendError(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    return Response.json({ message }, { status, headers: Bunster.headers });
  }

  private async handle(request: Request, traceId: string): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname !== "/") {
      return this.sendError("Not found", HttpStatus.NOT_FOUND);
    }

    let query = Object.fromEntries(searchParams.entries());
    const route = this.routes[query["action"]];

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
        log: (msg: string) => {
          this.#logger.log(`[${traceId}] ${msg}`);
        },
        meta: {},
      };

      // Execute middlewares
      for (const middleware of route.middlewares) {
        await middleware(context);
      }
      return Response.json(await route.handler(context), {
        headers: Bunster.headers,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        return this.sendError(error.message, error.status);
      } else {
        return this.sendError(error?.toString() ?? "An error occurred");
      }
    }
  }

  schedule(
    cronExpression: CronExpression,
    taskFunction: (context: SchedulerContext) => void
  ) {
    this.#scheduler.schedule(cronExpression, () => {
      const traceId = crypto.randomUUID();
      taskFunction({
        log: (msg: string) => {
          this.#logger.log(`[${traceId}] ${msg}`);
        },
      });
    });
  }

  listen(options: ServeOptions) {
    const server = Bun.serve({
      ...options,
      fetch: async (request) => {
        if (request.method === "OPTIONS") {
          return new Response(null, {
            headers: Bunster.headers,
            status: 204, // No Content
          });
        } else if (request.method === "POST") {
          const traceId = crypto.randomUUID();
          if (options.loggerConfig?.logRequest) {
            const startTime = Date.now();
            const response = await this.handle(request, traceId);
            const responseTime = Date.now() - startTime;
            this.#logger?.log(
              `[${traceId}] ${request.method} ${request.url} - ${response.status} [${responseTime}ms]`
            );
            return response;
          } else {
            return await this.handle(request, traceId);
          }
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
  createRouter,
  BunsterJwt,
  BunsterMail,
  HttpError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
  HttpStatus,
  BunsterDateTime,
  CronExpression,
  SchedulerContext,
};
