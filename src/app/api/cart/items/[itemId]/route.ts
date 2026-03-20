import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { updateCartItemSchema } from "@/lib/validation/cart";
import { getCartIdentityFromRequest } from "@/modules/cart/cart.identity";
import { removeCartItem, updateCartItemQuantity } from "@/modules/cart/cart.service";

type Params = {
  params: Promise<{ itemId: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const identity = getCartIdentityFromRequest(request);
    const { itemId } = await params;
    const body = await parseJson(request);
    const input = updateCartItemSchema.parse(body);

    const cart = await updateCartItemQuantity(identity, itemId, input.quantity);
    return ok({ cart });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const identity = getCartIdentityFromRequest(request);
    const { itemId } = await params;
    const cart = await removeCartItem(identity, itemId);
    return ok({ cart });
  } catch (error) {
    return handleRouteError(error);
  }
}
