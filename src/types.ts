import { RadixRouter } from "radix3";
import { ZodSchema, z } from "zod";
import { BunsterLoggerConfig } from "./logger";

export type ServeOptions = {
  port?: string | number;
  hostname?: string;
  loggerConfig?: BunsterLoggerConfig;
};

export type Router = {
  [key in HttpMethod]: RadixRouter<{
    method: HttpMethod;
    handler: BunsterHandler;
    input?: BunsterHandlerInput;
  }>;
};
export interface BunsterContext<P = any, Q = any, B = any> {
  params: P;
  query: Q;
  body: B;
  headers?: Request["headers"];
  log: (level: "info" | "debug" | "error" | "warn", msg: string) => void;
  meta: Record<string, unknown>;
  sendJson: (data: any) => Response | Promise<Response>;
  sendText: (data: string) => Response | Promise<Response>;
  setStatus: (statusCode: number) => void;
  setHeader: (name: string, value: string) => void;
}

export type BunsterHandlerInput<Params = any, Query = any, Body = any> = {
  body?: ZodSchema<Body, z.ZodTypeDef, any>;
  params?: ZodSchema<Params, z.ZodTypeDef, any>;
  query?: ZodSchema<Query, z.ZodTypeDef, any>;
};

export type RouteParams<P, Q, B> = {
  path: RoutePath;
  handler: BunsterHandler<P, Q, B>;
  input?: BunsterHandlerInput<P, Q, B>;
};

export type BunsterTaskContext = {
  log: (level: "info" | "debug" | "error" | "warn", msg: string) => void;
};

export type BunsterTaskHandler = (context: BunsterTaskContext) => void;

export type BunsterHandler<P = any, Q = any, B = any> = (
  context: BunsterContext<P, Q, B>
) => Response | Promise<Response>;

export type BunsterMiddleware<P = any, Q = any, B = any> = (
  context: BunsterContext<P, Q, B>
) => void;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type RoutePath = `/` | `${`/`}${string}`;
