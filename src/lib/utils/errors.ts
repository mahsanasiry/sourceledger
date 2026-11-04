export class AppError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

type DatabaseError = { message: string; code?: string; status?: number };

const POSTGRES_MESSAGES: Record<string, string> = {
  "23505": "That already exists.",
  "23503": "That item no longer exists. Refresh and try again.",
  "23514": "One of the values is not allowed. Check the form and try again.",
  "42501": "You do not have permission to do that.",
  PGRST116: "That item could not be found. It may have been deleted.",
};

export function fromDatabaseError(error: DatabaseError): AppError {
  const known = error.code ? POSTGRES_MESSAGES[error.code] : undefined;
  return new AppError(
    known ?? "Something went wrong while talking to the server.",
    error.status ?? 500,
  );
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof TypeError)
    return "The network request failed. Check your connection and try again.";
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Try again.";
}
