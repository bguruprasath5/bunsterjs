import {
  BunsterHandler,
  BunsterHandlerInput,
  HttpMethod,
  RouteParams,
  RoutePath,
} from "./types";

export class BunsterRouteGroup {
  #basePath: RoutePath;
  #routes: Array<{
    method: HttpMethod;
    params: RouteParams<any, any, any>;
  }> = [];

  constructor(basePath: RoutePath) {
    this.#basePath = basePath;
  }

  addRoute(
    path: RoutePath,
    handler: BunsterHandler,
    method: HttpMethod,
    input?: BunsterHandlerInput
  ) {
    this.#routes.push({
      method,
      params: { handler, path: (this.#basePath + path) as RoutePath, input },
    });
  }

  get<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(params.path, params.handler, "GET", params?.input);
  }

  post<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(params.path, params.handler, "POST", params?.input);
  }

  put<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(params.path, params.handler, "PUT", params?.input);
  }

  patch<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(params.path, params.handler, "PATCH", params?.input);
  }

  delete<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(params.path, params.handler, "DELETE", params?.input);
  }

  // Get all the routes in this group
  getRoutes(): Array<{
    method: HttpMethod;
    params: RouteParams<any, any, any>;
  }> {
    return this.#routes;
  }
}
