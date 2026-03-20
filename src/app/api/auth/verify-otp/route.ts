import { NextRequest } from "next/server";
import { verifyOtpSchema } from "@/lib/validation/auth";
import { AppError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIdentifier } from "@/lib/security/request";
import { verifyOtp } from "@/modules/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const client = getClientIdentifier(request);
    const rate = checkRateLimit(`verify-otp:${client}`, 12, 60_000);
    if (!rate.allowed) {
      throw new AppError("Too many OTP verification attempts. Please try again later.", 429);
    }

    const body = await request.json();
    const input = verifyOtpSchema.parse(body);

    await verifyOtp(input.target, input.code, input.purpose);

    return ok({ message: "OTP verified successfully" });
  } catch (error) {
    return handleRouteError(error);
  }
}
