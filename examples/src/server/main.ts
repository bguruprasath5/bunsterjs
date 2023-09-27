import { Bunster } from "@bunsterjs/server";
import { userRoutes } from "./modules/users/user.route";

const router = { ...userRoutes };

const app = new Bunster(router);

app.listen({
  port: 4040,
  loggerConfig: {
    logRequest: true,
  },
});

export type ApiRouter = typeof router;
