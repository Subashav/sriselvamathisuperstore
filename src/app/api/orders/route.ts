import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { listAllOrders, listOrdersForUser } from "@/modules/orders/order.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "admin") {
      await requireAdmin(request);
      const orders = await listAllOrders();
      return ok({ orders });
    }

    const user = await requireUser(request);
    const orders = await listOrdersForUser(user.id);
    return ok({ orders });
  } catch (error) {
    return handleRouteError(error);
  }
}
