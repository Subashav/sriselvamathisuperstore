import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

const orderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  subTotal: true,
  taxAmount: true,
  discountAmount: true,
  deliveryCharge: true,
  totalAmount: true,
  addressSnapshot: true,
  notes: true,
  placedAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      sku: true,
      quantity: true,
      unitPrice: true,
      gstRate: true,
      totalPrice: true,
    },
  },
  paymentRecords: {
    select: {
      id: true,
      provider: true,
      amount: true,
      status: true,
      method: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

export const listOrdersForUser = async (userId: string) => {
  return prisma.order.findMany({
    where: { userId },
    select: orderSelect,
    orderBy: { placedAt: "desc" },
  });
};

export const listAllOrders = async () => {
  return prisma.order.findMany({
    select: {
      ...orderSelect,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          mobile: true,
        },
      },
    },
    orderBy: { placedAt: "desc" },
  });
};

export const getOrderById = async (id: string, userId?: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      ...orderSelect,
      userId: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (userId && order.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  return order;
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Order not found", 404);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      paymentStatus: status === OrderStatus.DELIVERED ? PaymentStatus.CAPTURED : existing.paymentStatus,
    },
    select: orderSelect,
  });

  return updated;
};
