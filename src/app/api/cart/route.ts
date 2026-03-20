import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { getCartSummary } from "@/modules/cart/cart.service";
import { getCartIdentityFromRequest } from "@/modules/cart/cart.identity";

export async function GET(request: NextRequest) {
  try {
    const identity = getCartIdentityFromRequest(request);
    const cart = await getCartSummary(identity.userId, identity.guestToken);
    return ok({ cart });
  } catch (error) {
    return handleRouteError(error);
  }
}
