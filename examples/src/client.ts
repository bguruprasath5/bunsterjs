import { createApiClient } from "@bunsterjs/client";
import type { ApiRouter } from "./server/main";

const client = createApiClient<ApiRouter>("http://localhost:4040");
try {
  const getUserResponse = await client.getUsers({ page: 1 });
  console.log(getUserResponse);
} catch (error) {
  console.log(error);
}
