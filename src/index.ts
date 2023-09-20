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
  #routers: Router = Object.fromEntries(
    ["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => [
      method,
      createRouter(),
    ])
  ) as Router;

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
  }

  mount(params: {
    path: RoutePath;
    routeGroup: BunsterRouteGroup;
    middlewares?: BunsterMiddleware[];
  }) {
    for (const route of params.routeGroup.getRoutes()) {
      this.addRoute(
        params.path === "/"
          ? route.params.path
          : ((params.path + route.params.path) as RoutePath),
        route.params.handler,
        route.method,
        route.params?.input,
        route.params?.middlewares
      );
    }
  }

  get<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("GET", params);
  }

  post<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("POST", params);
  }

  put<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("PUT", params);
  }

  patch<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("PATCH", params);
  }

  delete<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.route("DELETE", params);
  }

  private sendResponse(
    data: any,
    contentType: string,
    status: number = 200,
    headers: HeadersInit = {}
  ) {
    return new Response(data, {
      status,
      headers: {
        "Content-Type": contentType,
        ...headers,
      },
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
  }): void {
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
  }

  listScheduledTasks(): string[] {
    return this.#scheduler.listTasks();
  }

  private async handle(requestId: string, request: Request) {
    const headers: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    let status = 200;

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
        sendJson: (data: any) => this.sendJson(data, status, headers),
        sendText: (data: string) => this.sendText(data, status, headers),
        setStatus: (statusCode: number) => {
          status = statusCode;
        },
        setHeader: (name: string, value: string) => {
          headers[name] = value;
        },
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
