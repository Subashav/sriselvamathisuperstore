import { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { AppError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIdentifier } from "@/lib/security/request";
import { requestPasswordReset } from "@/modules/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const client = getClientIdentifier(request);
    const rate = checkRateLimit(`forgot-password:${client}`, 5, 60_000);
    if (!rate.allowed) {
      throw new AppError("Too many reset requests. Please try again later.", 429);
    }

    const body = await request.json();
    const input = forgotPasswordSchema.parse(body);

    const result = await requestPasswordReset(input.identifier);

    return ok({
      message: "If an account exists, reset OTP has been sent",
      devOtp: result.otp,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
