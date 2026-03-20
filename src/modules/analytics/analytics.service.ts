import { prisma } from "@/lib/db/prisma";

export const getAdminOverview = async () => {
  const [
    totalProducts,
    totalCustomers,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    revenueAggregate,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: {
          in: ["CONFIRMED", "SHIPPED", "DELIVERED"],
        },
      },
    }),
    prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.minStock,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
      },
      take: 10,
      orderBy: {
        stock: "asc",
      },
    }),
    prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        placedAt: true,
      },
      take: 8,
      orderBy: { placedAt: "desc" },
    }),
  ]);

  return {
    metrics: {
      totalProducts,
      totalCustomers,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      grossRevenue: Number(revenueAggregate._sum.totalAmount ?? 0),
    },
    lowStockProducts,
    recentOrders,
  };
};
