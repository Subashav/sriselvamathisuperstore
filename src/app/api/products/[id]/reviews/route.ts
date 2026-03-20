import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { reviewCreateSchema } from "@/lib/validation/review";
import { createReview, listApprovedReviews } from "@/modules/reviews/review.service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const reviews = await listApprovedReviews(id);
    return ok({ reviews });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = await parseJson(request);
    const input = reviewCreateSchema.parse(body);
    const review = await createReview(user.id, id, input);
    return ok({ review }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
