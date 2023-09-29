import "reflect-metadata";
import { z } from "zod";
import { RouteContext } from "./types";

const ROUTE_METADATA_KEY = Symbol("route");

interface RouteMetadata<Input, Output> {
  name: string;
  schema: z.ZodType<Input>;
  handler: (context: RouteContext<Input>) => Output;
}

function Action<Input extends z.ZodType<any, any>>(inputZodSchema: Input) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const routes = Reflect.getMetadata(ROUTE_METADATA_KEY, target) || [];
    routes.push({
      name: propertyKey,
      schema: inputZodSchema,
      handler: descriptor.value,
    });
    Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target);
  };
}

type HandlerInputType<T> = T extends (context: RouteContext<infer U>) => any
  ? U
  : never;
type HandlerOutputType<T> = T extends (context: any) => infer U ? U : never;

type RouterDefinition<T> = {
  [K in keyof T]: Route<HandlerInputType<T[K]>, HandlerOutputType<T[K]>>;
};

interface Route<Input, Output> {
  schema: z.ZodType<Input, any, any>;
  handler: (context: RouteContext<Input>) => Output;
}

type FilteredKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? K : never;
}[keyof T];

type FilteredRouterDefinition<T> = {
  [K in FilteredKeys<T>]: Route<
    HandlerInputType<T[K]>,
    HandlerOutputType<T[K]>
  >;
};

// Create the router definition
function createRouterDefinition<T>(
  controllerClass: new () => T
): FilteredRouterDefinition<T> {
  const controllerInstance = new controllerClass();
  const routes: RouteMetadata<any, any>[] =
    Reflect.getMetadata(ROUTE_METADATA_KEY, controllerInstance as any) || [];
  const routeDefinitions: any = {};

  routes.forEach((route) => {
    routeDefinitions[route.name] = {
      schema: route.schema,
      handler: route.handler.bind(controllerInstance),
    };
  });

  return routeDefinitions;
}

// Example Usage
const customerSchema = z.object({ name: z.string() });

class CustomerController {
  @Action(customerSchema)
  findAllCustomers(context: RouteContext<{ name: string; id: number }>) {
    return { message: "Fetched successfully" };
  }
  findCustomers(context: RouteContext<{ name: string; id: number }>) {
    return { message: "Fetched successfully" };
  }
}

const customerRoutes = createRouterDefinition(CustomerController);
export type Router = typeof customerRoutes;
