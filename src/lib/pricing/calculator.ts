import type { Coupon, CouponType, Product } from "@prisma/client";

export type PricedLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  subTotal: number;
  taxAmount: number;
  totalWithTax: number;
};

export type CartTotals = {
  lines: PricedLine[];
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  totalAmount: number;
};

const round2 = (value: number) => Number(value.toFixed(2));

export const toNumber = (value: unknown) => Number(value ?? 0);

export const priceLine = (product: Product, quantity: number): PricedLine => {
  const unitPrice = toNumber(product.price);
  const gstRate = toNumber(product.gstRate);
  const subTotal = round2(unitPrice * quantity);
  const taxAmount = round2((subTotal * gstRate) / 100);

  return {
    productId: product.id,
    quantity,
    unitPrice,
    gstRate,
    subTotal,
    taxAmount,
    totalWithTax: round2(subTotal + taxAmount),
  };
};

export const calculateCouponDiscount = (
  coupon: Coupon | null,
  amountBeforeDiscount: number,
  lineProducts: string[],
): number => {
  if (!coupon) {
    return 0;
  }

  const minOrderValue = coupon.minOrderValue ? toNumber(coupon.minOrderValue) : 0;
  if (amountBeforeDiscount < minOrderValue) {
    return 0;
  }

  if (coupon.scope === "PRODUCT" && coupon.productId && !lineProducts.includes(coupon.productId)) {
    return 0;
  }

  let discount = 0;
  if (coupon.type === ("PERCENTAGE" as CouponType)) {
    discount = (amountBeforeDiscount * toNumber(coupon.value)) / 100;
  } else {
    discount = toNumber(coupon.value);
  }

  const cap = coupon.maxDiscount ? toNumber(coupon.maxDiscount) : Number.POSITIVE_INFINITY;
  discount = Math.min(discount, cap);
  return round2(Math.max(0, discount));
};

export const computeTotals = (
  lines: PricedLine[],
  coupon: Coupon | null,
  deliveryCharge: number,
): CartTotals => {
  const subTotal = round2(lines.reduce((sum, line) => sum + line.subTotal, 0));
  const taxAmount = round2(lines.reduce((sum, line) => sum + line.taxAmount, 0));
  const gross = round2(subTotal + taxAmount);
  const discountAmount = calculateCouponDiscount(
    coupon,
    gross,
    lines.map((line) => line.productId),
  );

  const totalAmount = round2(Math.max(0, gross - discountAmount + deliveryCharge));

  return {
    lines,
    subTotal,
    taxAmount,
    discountAmount,
    deliveryCharge: round2(deliveryCharge),
    totalAmount,
  };
};
