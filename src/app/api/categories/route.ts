import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        _count: {
          select: {
            products: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
        subcategories: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });

    return ok({ categories });
  } catch {
    return ok({ categories: [], dbOffline: true });
  }
}
