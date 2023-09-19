import { createRouter } from "radix3";
import { BunsterHandler, BunsterMiddleware, HttpMethod, Router } from "./types";

export class BunsterRouter {
  #routers: Router = Object.fromEntries(
    ["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => [
      method,
      createRouter(),
    ])
  ) as Router;

  middlewares: BunsterMiddleware[] = [];

  insertRoute(path: string, handler: BunsterHandler, method: HttpMethod) {
    this.#routers[method].insert(path, { handler, method });
  }

  middleware(middleware: BunsterMiddleware) {
    this.middlewares.push(middleware);
  }

  get(path: string, handler: BunsterHandler) {
    this.insertRoute(path, handler, "GET");
  }

  post(path: string, handler: BunsterHandler) {
    this.insertRoute(path, handler, "POST");
  }

  put(path: string, handler: BunsterHandler) {
    this.insertRoute(path, handler, "PUT");
  }

  patch(path: string, handler: BunsterHandler) {
    this.insertRoute(path, handler, "PATCH");
  }

  delete(path: string, handler: BunsterHandler) {
    this.insertRoute(path, handler, "DELETE");
  }

  lookup(path: string, method: HttpMethod) {
    return this.#routers[method].lookup(path);
  }
}
