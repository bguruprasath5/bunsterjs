import { z } from "zod";

export const getUserInputSchema = z.object({
  page: z.number().min(1),
});

export type GetUserInput = z.infer<typeof getUserInputSchema>;
