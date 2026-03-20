import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { addCartItemSchema } from "@/lib/validation/cart";
import { addItemToCart } from "@/modules/cart/cart.service";
import { getCartIdentityFromRequest } from "@/modules/cart/cart.identity";

export async function POST(request: NextRequest) {
  try {
    const identity = getCartIdentityFromRequest(request);
    const body = await parseJson(request);
    const input = addCartItemSchema.parse(body);

    const cart = await addItemToCart(identity, input.productId, input.quantity);
    return ok({ cart }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
