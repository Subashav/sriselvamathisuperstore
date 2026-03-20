import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { addressSchema } from "@/lib/validation/address";
import { createAddress, listAddresses } from "@/modules/addresses/address.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const addresses = await listAddresses(user.id);
    return ok({ addresses });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await parseJson(request);
    const input = addressSchema.parse(body);
    const address = await createAddress(user.id, input);
    return ok({ address }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
