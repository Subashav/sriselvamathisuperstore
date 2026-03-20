import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { checkoutPlaceOrderSchema } from "@/lib/validation/checkout";
import { getCartIdentityFromRequest } from "@/modules/cart/cart.identity";
import { placeOrderFromCart } from "@/modules/checkout/checkout.service";

export async function POST(request: NextRequest) {
  try {
    const identity = getCartIdentityFromRequest(request);
    const body = await parseJson(request);
    const input = checkoutPlaceOrderSchema.parse(body);

    const result = await placeOrderFromCart({
      identity,
      pincode: input.pincode,
      paymentMethod: input.paymentMethod,
      address: input.address,
      notes: input.notes,
    });

    return ok(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
