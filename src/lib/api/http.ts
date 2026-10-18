import type { ApiErrorResponse } from "@/types";
import type { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string, details?: Record<string, string[]>) =>
  new ApiError(400, message, details);
export const unauthenticated = () =>
  new ApiError(401, "Authentication required.");
export const forbidden = (message = "You do not have access to this resource.") =>
  new ApiError(403, message);
export const notFound = (message = "Resource not found.") =>
  new ApiError(404, message);

export function ok<T>(data: T) {
  return Response.json({ data }, { status: 200 });
}

export function created<T>(data: T) {
  return Response.json({ data }, { status: 201 });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    const body: ApiErrorResponse = {
      error: { message: error.message, details: error.details },
    };
    return Response.json(body, { status: error.status });
  }

  console.error(error);

  const body: ApiErrorResponse = {
    error: { message: "An unexpected error occurred." },
  };
  return Response.json(body, { status: 500 });
}

export function validationError(error: ZodError) {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    (details[key] ??= []).push(issue.message);
  }

  return badRequest("Invalid request body.", details);
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
}
