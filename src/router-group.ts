import {
  BunsterHandler,
  BunsterHandlerInput,
  BunsterMiddleware,
  HttpMethod,
  RouteParams,
  RoutePath,
} from "./types.ts";

export class BunsterRouteGroup {
  private basePath: RoutePath;
  private routes: Array<{
    method: HttpMethod;
    params: RouteParams<any, any, any>;
  }> = [];

  constructor(basePath: RoutePath) {
    this.basePath = basePath;
  }

  addRoute<P, Q, B>(
    path: RoutePath,
    handler: BunsterHandler,
    method: HttpMethod,
    input?: BunsterHandlerInput,
    middlewares?: BunsterMiddleware<P, Q, B>[]
  ) {
    this.routes.push({
      method,
      params: {
        handler,
        path: (this.basePath + path) as RoutePath,
        input,
        middlewares,
      },
    });
  }

  get<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(
      params.path,
      params.handler,
      "GET",
      params?.input,
      params.middlewares
    );
  }

  post<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(
      params.path,
      params.handler,
      "POST",
      params?.input,
      params.middlewares
    );
  }

  put<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(
      params.path,
      params.handler,
      "PUT",
      params?.input,
      params.middlewares
    );
  }

  patch<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(
      params.path,
      params.handler,
      "PATCH",
      params?.input,
      params.middlewares
    );
  }

  delete<P, Q, B>(params: RouteParams<P, Q, B>) {
    this.addRoute(
      params.path,
      params.handler,
      "DELETE",
      params?.input,
      params.middlewares
    );
  }

  // Get all the routes in this group
  getRoutes(): Array<{
    method: HttpMethod;
    params: RouteParams<any, any, any>;
  }> {
    return this.routes;
  }
}
