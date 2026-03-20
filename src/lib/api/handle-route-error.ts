import { fail } from "@/lib/api/response";
import { isAppError } from "@/lib/api/errors";
import { logger } from "@/lib/logging/logger";

export const handleRouteError = (error: unknown) => {
  if (isAppError(error)) {
    return fail(error.message, error.statusCode, error.details);
  }

  logger.error({ err: error }, "Unhandled API error");
  return fail("Internal server error", 500);
};
