import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { quoteSchema } from "@/lib/validation/checkout";
import { getCartIdentityFromRequest } from "@/modules/cart/cart.identity";
import { getCheckoutQuote } from "@/modules/checkout/checkout.service";

export async function POST(request: NextRequest) {
  try {
    const identity = getCartIdentityFromRequest(request);
    const body = await parseJson(request);
    const input = quoteSchema.parse(body);

    const quote = await getCheckoutQuote(identity, input.pincode);
    return ok({ quote });
  } catch (error) {
    return handleRouteError(error);
  }
}
