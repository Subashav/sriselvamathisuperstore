import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { getAuthUserIdFromRequest } from "@/lib/auth/session";
import { getUserById } from "@/modules/auth/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserIdFromRequest(request);
    const user = await getUserById(userId);

    return ok({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
