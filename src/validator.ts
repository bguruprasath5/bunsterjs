import { ZodError, ZodSchema } from "zod";
import { HttpError, HttpStatus } from ".";

export async function parseAndValidate<T>(
  data: any,
  schema?: ZodSchema<T>
): Promise<T | undefined> {
  try {
    if (!schema) return data;
    const parsedData = await schema.parseAsync(data);
    return parsedData;
  } catch (error) {
    throw new HttpError(
      formatFirstZodError(error as ZodError),
      HttpStatus.BAD_REQUEST
    );
  }
}

export function formatFirstZodError(error: ZodError): string {
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    return `${firstError.path.join(".")}: ${firstError.message.toLowerCase()}`;
  }
  return "Unknown validation error";
}
