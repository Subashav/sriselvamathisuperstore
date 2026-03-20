import { nanoid } from "nanoid";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { computeTotals, priceLine } from "@/lib/pricing/calculator";
import { getDeliveryChargeByPincode } from "@/modules/delivery/delivery.service";
import { clearCart, getCartSummary, getOrCreateCart } from "@/modules/cart/cart.service";

const generateOrderNumber = () => {
  return `TNS-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
};

export const getCheckoutQuote = async (
  identity: { userId?: string; guestToken?: string },
  pincode: string,
) => {
  const cartSummary = await getCartSummary(identity.userId, identity.guestToken);
  if (!cartSummary.items.length) {
    throw new AppError("Cart is empty", 400);
  }

  const delivery = await getDeliveryChargeByPincode(pincode, cartSummary.totals.subTotal + cartSummary.totals.taxAmount);
  if (!delivery.eligible) {
    throw new AppError(delivery.message, 400);
  }

  const cart = await getOrCreateCart(identity.userId, identity.guestToken);
  const dbCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      coupon: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!dbCart) {
    throw new AppError("Cart not found", 404);
  }

  const lines = dbCart.items.map((item) => priceLine(item.product, item.quantity));
  const totals = computeTotals(lines, dbCart.coupon, delivery.charge);

  return {
    cartId: dbCart.id,
    delivery,
    totals,
  };
};

export const placeOrderFromCart = async (input: {
  identity: { userId?: string; guestToken?: string };
  pincode: string;
  paymentMethod: "UPI" | "CARD" | "NET_BANKING" | "WALLET" | "COD";
  address: {
    fullName: string;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    phone: string;
  };
  notes?: string;
}) => {
  const cart = await getOrCreateCart(input.identity.userId, input.identity.guestToken);

  const dbCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      coupon: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!dbCart || !dbCart.items.length) {
    throw new AppError("Cart is empty", 400);
  }

  for (const item of dbCart.items) {
    if (item.product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${item.product.name}`, 400);
    }
  }

  const delivery = await getDeliveryChargeByPincode(input.pincode, 0);
  if (!delivery.eligible) {
    throw new AppError(delivery.message, 400);
  }

  const lines = dbCart.items.map((item) => priceLine(item.product, item.quantity));
  const totals = computeTotals(lines, dbCart.coupon, delivery.charge);

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: input.identity.userId,
        guestId: input.identity.guestToken,
        paymentMethod: input.paymentMethod,
        subTotal: totals.subTotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        deliveryCharge: totals.deliveryCharge,
        totalAmount: totals.totalAmount,
        addressSnapshot: input.address,
        notes: input.notes,
        items: {
          create: dbCart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.product.price,
            gstRate: item.product.gstRate,
            totalPrice: Number((Number(item.product.price) * item.quantity).toFixed(2)),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    for (const item of dbCart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          deltaQty: -item.quantity,
          reason: "ORDER_PLACED",
          reference: createdOrder.id,
          createdById: input.identity.userId,
        },
      });
    }

    if (dbCart.couponId) {
      await tx.coupon.update({
        where: { id: dbCart.couponId },
        data: { usedCount: { increment: 1 } },
      });

      if (input.identity.userId) {
        await tx.couponRedemption.create({
          data: {
            couponId: dbCart.couponId,
            userId: input.identity.userId,
            orderId: createdOrder.id,
            discountAmount: totals.discountAmount,
          },
        });
      }
    }

    await tx.paymentTransaction.create({
      data: {
        orderId: createdOrder.id,
        provider: input.paymentMethod === "COD" ? "COD" : "RAZORPAY",
        amount: totals.totalAmount,
        method: input.paymentMethod,
      },
    });

    return createdOrder;
  });

  await clearCart(cart.id);

  await prisma.notificationLog.create({
    data: {
      userId: input.identity.userId,
      channel: "EMAIL",
      template: "ORDER_PLACED",
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: totals.totalAmount,
      },
      status: "QUEUED",
    },
  });

  return {
    order,
    totals,
    delivery,
  };
};
