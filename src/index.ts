import { Server } from "bun";
import { createRouter } from "radix3";
import { ZodError } from "zod";
import { formatFirstZodError, parseAndValidate } from "./validator.ts";
import {
  BunsterContext,
  BunsterHandler,
  BunsterHandlerInput,
  BunsterMiddleware,
  BunsterTaskHandler,
  HttpMethod,
  MountParams,
  RouteParams,
  RoutePath,
  Router,
  ServeOptions,
} from "./types.ts";
import { BunsterRouteGroup } from "./router-group.ts";
import { Scheduler } from "./scheduler.ts";
import { BunsterJwt } from "./jwt.ts";
import { BunsterMail } from "./mail.ts";
import BunsterLogger from "./logger.ts";

class Bunster {
  #scheduler: Scheduler = new Scheduler();
  #logger: BunsterLogger | null = null;
  #cors: boolean = false;
  #routers: Router = Object.fromEntries(
    ["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => [
      method,
      createRouter(),
    ])
  ) as Router;
  static headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  #middlewares: BunsterMiddleware[] = [];

  private route<P, Q, B>(method: HttpMethod, params: RouteParams<P, Q, B>) {
    this.addRoute(
      params.path,
      params.handler,
      method,
      params?.input,
      params?.middlewares
    );
  }

  private addRoute(
    path: RoutePath,
    handler: BunsterHandler,
    method: HttpMethod,
    input?: BunsterHandlerInput,
    middlewares?: BunsterMiddleware[]
  ) {
    this.#routers[method].insert(path, { handler, method, input, middlewares });
  }

  globalMiddleware(middleware: BunsterMiddleware) {
    this.#middlewares.push(middleware);
    return this;
  }

  mount(params: MountParams) {
    for (const route of params.routeGroup.getRoutes()) {
      this.route(route.method, route.params);
    }
    return this;
  }

  get<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("GET", params);
    return this;
  }

  post<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("POST", params);
    return this;
  }

  put<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("PUT", params);
    return this;
  }

  patch<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("PATCH", params);
    return this;
  }

  delete<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("DELETE", params);
    return this;
  }

  private sendResponse(
    data: any,
    contentType: string,
    status: number = 200,
    headers: HeadersInit = {}
  ) {
    const responseHeaders = {
      "Content-Type": contentType,
      ...headers,
    };
    if (this.#cors) {
      Object.assign(responseHeaders, Bunster.headers);
    }

    return new Response(data, {
      status,
      headers: responseHeaders,
    });
  }

  private sendJson(data: any, status: number = 200, headers: HeadersInit = {}) {
    return this.sendResponse(
      JSON.stringify(data),
      "application/json",
      status,
      headers
    );
  }

  private sendText(data: any, status: number = 200, headers: HeadersInit = {}) {
    return this.sendResponse(data.toString(), "text/plain", status, headers);
  }

  private sendError(message: string, status: number = 500) {
    return this.sendJson({ message }, status);
  }

  schedule(params: {
    id: string;
    cronExpression: string;
    task: BunsterTaskHandler;
  }) {
    this.#scheduler.schedule(params.id, params.cronExpression, () => {
      const requestId = crypto.randomUUID();
      params.task({
        log: (
          level: "info" | "debug" | "error" | "warn" = "info",
          msg: string
        ) => {
          this.#logger?.[level](`[${requestId}]  ${msg}`);
        },
      });
    });
    return this;
  }

  listScheduledTasks(): string[] {
    return this.#scheduler.listTasks();
  }

  private async handle(requestId: string, request: Request) {
    const { pathname, searchParams } = new URL(request.url);

    const matched =
      this.#routers[request.method as HttpMethod].lookup(pathname);

    if (!matched) {
      return this.sendJson({ message: "Not found" }, 404);
    }
    const logRequest = (
      level: "info" | "debug" | "error" | "warn",
      msg: string
    ) => {
      this.#logger?.[level](`[${requestId}]  ${msg}`);
    };
    try {
      const { input } = matched;

      const context: BunsterContext = {
        params:
          input?.params &&
          (await parseAndValidate(matched.params, input.params)),
        query:
          input?.query &&
          (await parseAndValidate(
            Object.fromEntries(searchParams.entries()),
            input.query
          )),
        body:
          input?.body &&
          (await parseAndValidate(await request.json(), input.body)),
        meta: {},
        headers: request.headers,
        log: logRequest,
        sendJson: (
          data: any,
          params?: { headers?: HeadersInit; status?: number }
        ) =>
          this.sendJson(data, params?.status, {
            ...params?.headers,
          }),
        sendText: (
          data: string,
          params?: { headers?: HeadersInit; status?: number }
        ) =>
          this.sendText(data, params?.status, {
            ...params?.headers,
          }),
      };

      await Promise.all(
        this.#middlewares.map((middleware) => middleware(context))
      );
      if (matched.middlewares) {
        await Promise.all(
          matched.middlewares?.map((middleware) => middleware(context))
        );
      }

      return matched.handler(context);
    } catch (error) {
      this.#logger?.error(`${error}`);
      if (error instanceof ZodError) {
        return this.sendError(formatFirstZodError(error));
      }
      return this.sendError(error?.toString() ?? "An error occurred");
    }
  }

  /**
   * @param options Bun server options
   * @param cb Server callback after server starts listening
   */
  serve(options: ServeOptions, cb?: (server: Server) => void) {
    this.#logger = new BunsterLogger(options.loggerConfig);
    this.#cors = options.cors ?? false;
    const server = Bun.serve({
      ...options,
      fetch: async (request) => {
        const requestId = crypto.randomUUID();
        if (options.loggerConfig?.logRequest) {
          const startTime = Date.now();
          const response = await this.handle(requestId, request);
          const responseTime = Date.now() - startTime;
          this.#logger?.log(
            "info",
            `[${requestId}] ${request.method} ${request.url} - ${response.status} [${responseTime}ms]`
          );
          return response;
        } else {
          return await this.handle(requestId, request);
        }
      },
    });
    console.log(
      `🚀 Bunster server started at http://${server.hostname}:${server.port}`
    );
    cb?.(server);

    return server;
  }
}

export { Bunster, BunsterRouteGroup, BunsterJwt, BunsterMail };
