import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIdentifier } from "@/lib/security/request";
import { registerUser } from "@/modules/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const client = getClientIdentifier(request);
    const rate = checkRateLimit(`register:${client}`, 6, 60_000);
    if (!rate.allowed) {
      throw new AppError("Too many registration attempts. Please try again later.", 429);
    }

    const body = await request.json();
    const input = registerSchema.parse(body);

    const result = await registerUser(input);

    return ok(
      {
        user: result.user,
        message: "Registration successful. Verify OTP to activate account.",
        devOtp: result.otp,
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
