import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { reviewModerationSchema } from "@/lib/validation/review";
import { moderateReview } from "@/modules/reviews/review.service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await parseJson(request);
    const input = reviewModerationSchema.parse(body);
    const review = await moderateReview(id, input.status);

    return ok({ review });
  } catch (error) {
    return handleRouteError(error);
  }
}
