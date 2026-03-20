import { NextRequest } from "next/server";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { updateOrderStatus } from "@/modules/orders/order.service";

const schema = z.object({
  status: z.nativeEnum(OrderStatus),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await parseJson(request);
    const input = schema.parse(body);

    const order = await updateOrderStatus(id, input.status);
    return ok({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
