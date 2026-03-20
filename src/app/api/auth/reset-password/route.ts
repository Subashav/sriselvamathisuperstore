import { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { AppError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getClientIdentifier } from "@/lib/security/request";
import { resetPassword } from "@/modules/auth/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const client = getClientIdentifier(request);
    const rate = checkRateLimit(`reset-password:${client}`, 8, 60_000);
    if (!rate.allowed) {
      throw new AppError("Too many reset attempts. Please try again later.", 429);
    }

    const body = await request.json();
    const input = resetPasswordSchema.parse(body);

    await resetPassword(input.target, input.code, input.newPassword);

    return ok({ message: "Password reset successful" });
  } catch (error) {
    return handleRouteError(error);
  }
}
