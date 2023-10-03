import axios, { AxiosInstance } from "axios";
import { ApiClientType, CreateApiClientConfig, Route } from "./types";

function createApiClient<R extends Record<string, Route<any, any>>>(
  params: CreateApiClientConfig
): ApiClientType<R> {
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: params.baseUrl,
  });

  if (params.requestInterceptor) {
    axiosInstance.interceptors.request.use(params.requestInterceptor);
  }
  if (params.responseInterceptor) {
    axiosInstance.interceptors.response.use(params.responseInterceptor);
  }

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
