import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { getOrderById } from "@/modules/orders/order.service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    if (searchParams.get("mode") === "admin") {
      await requireAdmin(request);
      const order = await getOrderById(id);
      return ok({ order });
    }

    const user = await requireUser(request);
    const order = await getOrderById(id, user.id);
    return ok({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
