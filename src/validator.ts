import { ZodError, ZodSchema } from "zod";

export function parseAndValidate<T>(
  data: any,
  schema?: ZodSchema<T>
): T | undefined {
  if (!schema) return data;
  return schema.parse(data);
}

export function formatFirstZodError(error: ZodError): string {
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    return `${firstError.path.join(".")}: ${firstError.message.toLowerCase()}`;
  }
  return "Unknown validation error";
}
