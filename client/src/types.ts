import { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ZodSchema, z } from "zod";

export type Routes = { [key: string]: Route<any, any> };

export type ExtractRouteType<R, K extends keyof R> = R[K] extends Route<
  infer Input,
  infer Output
>
  ? (input: Input) => Promise<Output>
  : never;

export type ApiClientType<R extends Routes> = {
  [K in keyof R]: ExtractRouteType<R, K>;
};

type Middleware = (context: RouteContext) => Promise<void>;

type RouteOutput = { [key: string]: any } | any[];

type RouteContext<Input = any> = {
  input?: Input;
  log: (message: string) => void;
  headers: Headers;
  meta: Record<string, any>;
};

type RouteHandler<Input, Output extends RouteOutput> = (
  context: RouteContext<Input>
) => Output | Promise<Output>;

export type Route<Input = any, Output extends RouteOutput = any> = {
  input?: ZodSchema<Input, z.ZodTypeDef, any>;
  handler: RouteHandler<Input, Output>;
  middlewares: Middleware[];
};

export interface CreateApiClientConfig {
  baseUrl: string;
  requestInterceptor?: (
    config: InternalAxiosRequestConfig
  ) => InternalAxiosRequestConfig;
  responseInterceptor?: (response: AxiosResponse) => AxiosResponse;
}
