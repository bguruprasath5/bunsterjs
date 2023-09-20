import { Server } from "bun";
import BunsterLogger from "./logger";
import { createRouter } from "radix3";
import { v4 as uuidv4 } from "uuid";
import { ZodError } from "zod";
import { formatFirstZodError, parseAndValidate } from "./validator";
import {
  BunsterContext,
  BunsterHandler,
  BunsterHandlerInput,
  BunsterMiddleware,
  HttpMethod,
  RouteParams,
  Router,
  ServeOptions,
} from "./types";

export class Bunster {
  #corsConfig = {
    allowAnyOrigin: true,
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  #routers: Router = Object.fromEntries(
    ["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => [
      method,
      createRouter(),
    ])
  ) as Router;

  middlewares: BunsterMiddleware[] = [];

  addRoute(
    path: string,
    handler: BunsterHandler,
    method: HttpMethod,
    input?: BunsterHandlerInput
  ) {
    this.#routers[method].insert(path, { handler, method, input });
  }

  globalMiddleware(middleware: BunsterMiddleware) {
    this.middlewares.push(middleware);
  }

  get<P, Q, B>(
    path: string,
    handler: BunsterHandler<P, Q, B>,
    params?: RouteParams<P, Q, B>
  ) {
    this.addRoute(path, handler, "GET", params?.input);
  }

  post<P, Q, B>(
    path: string,
    handler: BunsterHandler<P, Q, B>,
    params?: RouteParams<P, Q, B>
  ) {
    this.addRoute(path, handler, "POST", params?.input);
  }

  put<P, Q, B>(
    path: string,
    handler: BunsterHandler<P, Q, B>,
    params?: RouteParams<P, Q, B>
  ) {
    this.addRoute(path, handler, "PUT", params?.input);
  }

  patch<P, Q, B>(
    path: string,
    handler: BunsterHandler<P, Q, B>,
    params?: RouteParams<P, Q, B>
  ) {
    this.addRoute(path, handler, "PATCH", params?.input);
  }

  delete<P, Q, B>(
    path: string,
    handler: BunsterHandler<P, Q, B>,
    params?: RouteParams<P, Q, B>
  ) {
    this.addRoute(path, handler, "DELETE", params?.input);
  }

  lookup(path: string, method: HttpMethod) {
    return this.#routers[method].lookup(path);
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

  private async handle(request: Request, logger: BunsterLogger) {
    const startTime = Date.now();
    let requestId = uuidv4();

    let headers: Record<string, string> = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        this.#corsConfig.allowedMethods.join(", "),
      "Access-Control-Allow-Headers":
        this.#corsConfig.allowedHeaders.join(", "),
    };

    let status = 200;

    const { pathname, searchParams } = new URL(request.url);

    const matched =
      this.#routers[request.method as HttpMethod].lookup(pathname);

    if (!matched) {
      const responseTime = Date.now() - startTime;
      logger.log(
        "info",
        `[${requestId}] ${
          request.method
        } ${pathname} - ${404} [${responseTime}ms]`
      );
      return this.sendJson({ message: "Not found" }, 404);
    }
    try {
      const query: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        query[key] = value;
      });
      const context: BunsterContext = {
        params: parseAndValidate(matched.params, matched.input?.params),
        query: parseAndValidate(query, matched.input?.query),
        body: request.body
          ? parseAndValidate(await request.json(), matched.input?.body)
          : undefined,
        meta: {},
        headers: request.headers,
        log: (
          msg: string,
          level: "info" | "debug" | "error" | "warn" = "info"
        ) => {
          logger[level](`[${requestId}]  ${msg}`);
        },
        sendJson: (data: any) => {
          return this.sendJson(data, status, headers);
        },
        sendText: (data: string) => {
          return this.sendText(data, status, headers);
        },
        setStatus: (statusCode: number) => {
          status = statusCode;
        },
        setHeader: (name: string, value: string) => {
          headers[name] = value;
        },
      };
      if (matched.input?.params) {
        context.params = parseAndValidate(matched.params, matched.input.params);
      }
      if (matched.input?.query) {
        const query: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          query[key] = value;
        });
        context.query = parseAndValidate(query, matched.input.query);
      }
      if (matched.input?.body) {
        if (request.body) {
          context.body = parseAndValidate(
            await request.json(),
            matched.input.body
          );
        }
      }

      for (const middleware of this.middlewares) {
        await middleware(context);
      }
      const response = await matched.handler(context);

      const responseTime = Date.now() - startTime;
      logger.log(
        "info",
        `[${requestId}] ${request.method} ${pathname} - ${status} [${responseTime}ms]`
      );
      return response;
    } catch (error) {
      logger.error(`${error}`);
      const responseTime = Date.now() - startTime;
      logger.log(
        "info",
        `[${requestId}] ${
          request.method
        } ${pathname} - ${500} [${responseTime}ms]`
      );
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
    const logger = new BunsterLogger(options.loggerConfig);
    const server = Bun.serve({
      ...options,
      fetch: async (request) => {
        return await this.handle(request, logger);
      },
    });
    console.log(
      `🚀 Bunster server started at http://${server.hostname}:${server.port}`
    );
    cb?.(server);

    return server;
  }
}
