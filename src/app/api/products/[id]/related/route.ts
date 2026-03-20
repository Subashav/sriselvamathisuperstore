import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return ok({ related: [] });
    }

    const related = await prisma.product.findMany({
      where: {
        id: { not: id },
        categoryId: product.categoryId,
        status: "ACTIVE",
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      take: 8,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    return ok({ related });
  } catch (error) {
    return handleRouteError(error);
  }
}
