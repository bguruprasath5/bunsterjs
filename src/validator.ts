import { ZodError, ZodSchema } from "zod";

export async function parseAndValidate<T>(
  data: any,
  schema?: ZodSchema<T>
): Promise<T | undefined> {
  if (!schema) return data;
  const parsedData = await schema.parseAsync(data);
  return parsedData;
}

export function formatFirstZodError(error: ZodError): string {
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    return `${firstError.path.join(".")}: ${firstError.message.toLowerCase()}`;
  }
  return "Unknown validation error";
}
