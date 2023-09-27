import { RouteContext } from "@bunsterjs/server";
import { GetUserInput } from "./user.model";

export async function getUsers(context: RouteContext<GetUserInput>) {
  context.log("inside getUsers");
  return {
    message: "Users list fetched successfully",
    data: [
      {
        id: 1,
        name: "Abc",
      },
      {
        id: 2,
        name: "Xyz",
      },
      {
        id: 3,
        name: "Pqr",
      },
    ],
  };
}
