import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { handleRouteError } from "@/lib/api/handle-route-error";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            mobile: true,
          },
        },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        placedAt: "desc",
      },
      take: 1000,
    });

    const headers = [
      "Order ID",
      "Order Number",
      "Placed At",
      "Status",
      "Payment Status",
      "Payment Method",
      "Customer Name",
      "Customer Email",
      "Customer Mobile",
      "Items Count",
      "Items Summary",
      "Total Amount",
    ];

    const rows = orders.map((order) => {
      const itemSummary = order.items
        .map((item) => `${item.product.name} (SKU:${item.product.sku}) x${item.quantity} @ ${item.unitPrice.toString()}`)
        .join(" | ");

      return [
        order.id,
        order.orderNumber,
        new Date(order.placedAt).toISOString(),
        order.status,
        order.paymentStatus,
        order.paymentMethod ?? "",
        order.user?.fullName ?? "Guest",
        order.user?.email ?? "",
        order.user?.mobile ?? "",
        order.items.length,
        itemSummary,
        order.totalAmount.toString(),
      ];
    });

    const csv = [headers, ...rows]
      .map((line) => line.map(csvEscape).join(","))
      .join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-export-${Date.now()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
