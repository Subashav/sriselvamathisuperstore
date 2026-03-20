import type { Coupon } from "@prisma/client";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { computeTotals, priceLine } from "@/lib/pricing/calculator";

const getValidCoupon = async (code: string, userId?: string): Promise<Coupon> => {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) {
    throw new AppError("Invalid coupon", 404);
  }

  const now = new Date();
  if (!coupon.isActive || coupon.startsAt > now || coupon.endsAt < now) {
    throw new AppError("Coupon is not active", 400);
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  if (userId && coupon.perUserLimit) {
    const redeemed = await prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        userId,
      },
    });

    if (redeemed >= coupon.perUserLimit) {
      throw new AppError("Coupon limit reached for this user", 400);
    }
  }

  return coupon;
};

export const getOrCreateCart = async (userId?: string, guestToken?: string) => {
  if (!userId && !guestToken) {
    throw new AppError("Cart identity required", 400);
  }

  const existing = await prisma.cart.findFirst({
    where: userId ? { userId } : { guestId: guestToken },
  });

  if (existing) {
    return existing;
  }

  return prisma.cart.create({
    data: {
      userId,
      guestId: guestToken,
    },
  });
};

export const addItemToCart = async (identity: { userId?: string; guestToken?: string }, productId: string, quantity: number) => {
  const cart = await getOrCreateCart(identity.userId, identity.guestToken);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "ACTIVE") {
    throw new AppError("Product not available", 404);
  }

  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    update: {
      quantity: { increment: quantity },
      unitPrice: product.price,
      gstRate: product.gstRate,
    },
    create: {
      cartId: cart.id,
      productId,
      quantity,
      unitPrice: product.price,
      gstRate: product.gstRate,
    },
  });

  return getCartSummary(identity.userId, identity.guestToken);
};

export const updateCartItemQuantity = async (
  identity: { userId?: string; guestToken?: string },
  itemId: string,
  quantity: number,
) => {
  const cart = await getOrCreateCart(identity.userId, identity.guestToken);

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },
    include: { product: true },
  });

  if (!item) {
    throw new AppError("Cart item not found", 404);
  }

  if (item.product.stock < quantity) {
    throw new AppError("Requested quantity exceeds available stock", 400);
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return getCartSummary(identity.userId, identity.guestToken);
};

export const removeCartItem = async (identity: { userId?: string; guestToken?: string }, itemId: string) => {
  const cart = await getOrCreateCart(identity.userId, identity.guestToken);

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) {
    throw new AppError("Cart item not found", 404);
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCartSummary(identity.userId, identity.guestToken);
};

export const applyCouponToCart = async (identity: { userId?: string; guestToken?: string }, code: string) => {
  const cart = await getOrCreateCart(identity.userId, identity.guestToken);
  const coupon = await getValidCoupon(code, identity.userId);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: coupon.id },
  });

  return getCartSummary(identity.userId, identity.guestToken);
};

export const getCartSummary = async (userId?: string, guestToken?: string) => {
  const cart = await getOrCreateCart(userId, guestToken);

  const dbCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      coupon: true,
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!dbCart) {
    throw new AppError("Cart not found", 404);
  }

  const lines = dbCart.items.map((item) => priceLine(item.product, item.quantity));
  const totals = computeTotals(lines, dbCart.coupon, 0);

  return {
    id: dbCart.id,
    coupon: dbCart.coupon,
    items: dbCart.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        stock: item.product.stock,
        price: item.product.price,
        gstRate: item.product.gstRate,
        image: item.product.images[0]?.imageUrl ?? null,
      },
    })),
    totals,
  };
};

export const clearCart = async (cartId: string) => {
  await prisma.cartItem.deleteMany({ where: { cartId } });
};
