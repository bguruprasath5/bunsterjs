import { route } from "@bunsterjs/server";
import { getUserInputSchema } from "./user.model";
import { getUsers } from "./user.service";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const userRoutes = {
  getUsers: route(getUserInputSchema).handle(getUsers, [authMiddleware]),
};
