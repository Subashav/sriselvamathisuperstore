import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { applyCouponSchema } from "@/lib/validation/cart";
import { getCartIdentityFromRequest } from "@/modules/cart/cart.identity";
import { applyCouponToCart } from "@/modules/cart/cart.service";

export async function POST(request: NextRequest) {
  try {
    const identity = getCartIdentityFromRequest(request);
    const body = await parseJson(request);
    const input = applyCouponSchema.parse(body);

    const cart = await applyCouponToCart(identity, input.code);
    return ok({ cart });
  } catch (error) {
    return handleRouteError(error);
  }
}
