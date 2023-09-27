import axios, { AxiosInstance } from "axios";
import { Route } from "./types";

type Routes = { [key: string]: Route<any, any> };

type ExtractRouteType<R, K extends keyof R> = R[K] extends Route<
  infer Input,
  infer Output
>
  ? (input: Input) => Promise<Output>
  : never;

type ApiClientType<R extends Routes> = {
  [K in keyof R]: ExtractRouteType<R, K>;
};

function createApiClient<R extends Record<string, Route<any, any>>>(
  baseUrl: string
): ApiClientType<R> {
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: baseUrl,
  });

  const handler = {
    get: function (target: any, prop: string) {
      if (typeof prop === "string") {
        return async function (input: any) {
          const { data } = await axiosInstance.post(`/?action=${prop}`, input);
          return data;
        };
      }
    },
  };

  return new Proxy({}, handler) as ApiClientType<R>;
}

export { createApiClient };
