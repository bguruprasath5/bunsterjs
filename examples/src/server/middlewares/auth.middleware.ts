import { RouteContext } from "@bunsterjs/server";

export async function authMiddleware(context: RouteContext) {
  context.log("inside getUsers middleware");
  //throw new HttpError("Invalid param", HttpStatus.BAD_REQUEST);
}
