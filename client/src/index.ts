import axios, { AxiosInstance } from "axios";
import { ApiClientType, Route } from "./types";

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
