import { z } from "zod";
import { BunsterRouteGroup } from "../src/router-group";

const inputSchema = {
  query: z.object({
    name: z.string(),
  }),
  params: z.object({
    id: z.coerce.number(),
  }),
};

const userRouteGroup = new BunsterRouteGroup("/user");

userRouteGroup.get({
  path: "/id/:id",
  input: inputSchema,
  handler: (ctx) => {
    return ctx.sendText(`user id = ${ctx.params.id}, name = ${ctx.query.name}`);
  },
});

export default userRouteGroup;
