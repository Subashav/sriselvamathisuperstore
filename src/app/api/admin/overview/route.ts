import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminOverview } from "@/modules/analytics/analytics.service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const dashboard = await getAdminOverview();
    return ok({ dashboard });
  } catch (error) {
    return handleRouteError(error);
  }
}
