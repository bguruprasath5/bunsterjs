import type { RadixRouter } from "radix3";
import BunsterLogger from "./logger";
import { HttpStatusCode } from "./enum";

export type ServeOptions = {
  /**
   * What port should the server listen on?
   * @default process.env.PORT || "3000"
   */
  port?: string | number;

  /**
   * What hostname should the server listen on?
   *
   * @default
   * ```js
   * "0.0.0.0" // listen on all interfaces
   * ```
   * @example
   *  ```js
   * "127.0.0.1" // Only listen locally
   * ```
   * @example
   * ```js
   * "remix.run" // Only listen on remix.run
   * ````
   *
   * note: hostname should not include a {@link port}
   */
  hostname?: string;
};

export type Router = {
  [key in HttpMethod]: RadixRouter<{
    method: HttpMethod;
    handler: BunsterHandler;
  }>;
};

export type ParamOrQuery = Record<string, unknown>;

export interface BunsterContext {
  params: ParamOrQuery;
  query: ParamOrQuery;
  body?: any;
  headers?: Request["headers"];
  logger: BunsterLogger;
  meta: ParamOrQuery;
}

export interface BunsterResponse {
  status?: HttpStatusCode;
  message: string;
  data?: any;
}

export type BunHandlerReturnType =
  | BunsterResponse
  | Promise<BunsterResponse>
  | Error;

export type BunsterHandler = (context: BunsterContext) => BunHandlerReturnType;

export type BunsterMiddleware = (context: BunsterContext) => void;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
