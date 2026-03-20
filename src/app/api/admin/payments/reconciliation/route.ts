import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const transactions = await prisma.paymentTransaction.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const summary = {
      totalTransactions: transactions.length,
      created: transactions.filter((item) => item.status === "CREATED").length,
      captured: transactions.filter((item) => item.status === "CAPTURED").length,
      failed: transactions.filter((item) => item.status === "FAILED").length,
      refunded: transactions.filter((item) => item.status === "REFUNDED" || item.status === "PARTIALLY_REFUNDED").length,
    };

    return ok({ summary, transactions });
  } catch (error) {
    return handleRouteError(error);
  }
}
