import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { addressUpdateSchema } from "@/lib/validation/address";
import { deleteAddress, updateAddress } from "@/modules/addresses/address.service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = await parseJson(request);
    const input = addressUpdateSchema.parse(body);
    const address = await updateAddress(user.id, id, input);
    return ok({ address });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    await deleteAddress(user.id, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
