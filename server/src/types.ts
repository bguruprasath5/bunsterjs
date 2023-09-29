import { ZodSchema, z } from "zod";
import { BunsterLoggerConfig } from "./logger";

export type ServeOptions = {
  port?: string | number;
  hostname?: string;
  loggerConfig?: BunsterLoggerConfig;
};

export type Middleware = (context: RouteContext) => Promise<void>;

export type RouteOutput = { [key: string]: any } | any[];

export type Logger = (message: string) => void;

export type RouteContext<Input = any> = {
  input?: Input;
  log: Logger;
  headers: Headers;
  meta: Record<string, any>;
};

export type SchedulerContext = {
  log: Logger;
};

export type RouteHandler<Input, Output extends RouteOutput> = (
  context: RouteContext<Input>
) => Output | Promise<Output>;

export type Route<Input = any, Output extends RouteOutput = any> = {
  input?: ZodSchema<Input, z.ZodTypeDef, any>;
  handler: RouteHandler<Input, Output>;
  middlewares: Middleware[];
};
