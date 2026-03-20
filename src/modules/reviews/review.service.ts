import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

export const listApprovedReviews = async (productId: string) => {
  return prisma.review.findMany({
    where: {
      productId,
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });
};

export const createReview = async (
  userId: string,
  productId: string,
  payload: { rating: number; title?: string; comment?: string },
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existing = await prisma.review.findFirst({ where: { userId, productId } });
  if (existing) {
    throw new AppError("Review already submitted for this product", 409);
  }

  return prisma.review.create({
    data: {
      userId,
      productId,
      rating: payload.rating,
      title: payload.title,
      comment: payload.comment,
    },
  });
};

export const moderateReview = async (reviewId: string, status: "APPROVED" | "REJECTED") => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError("Review not found", 404);
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: { status },
  });
};
