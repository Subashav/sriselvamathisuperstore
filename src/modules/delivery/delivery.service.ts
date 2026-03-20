import { DeliveryChargeType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const getDeliveryChargeByPincode = async (pincode: string, orderAmount: number) => {
  const zone = await prisma.deliveryZone.findFirst({
    where: {
      isActive: true,
      pincodes: {
        has: pincode,
      },
    },
  });

  if (!zone) {
    return {
      eligible: false,
      charge: 0,
      zone: null,
      message: "Delivery is currently unavailable for this pincode",
    };
  }

  const freeAbove = zone.freeAbove ? Number(zone.freeAbove) : undefined;
  if (freeAbove !== undefined && orderAmount >= freeAbove) {
    return {
      eligible: true,
      charge: 0,
      zone: zone.name,
      message: "Free delivery applied",
    };
  }

  let charge = 0;
  if (zone.chargeType === DeliveryChargeType.FLAT) {
    charge = Number(zone.flatCharge ?? 0);
  } else {
    charge = Number(zone.baseCharge ?? 0);
  }

  return {
    eligible: true,
    charge: Number(charge.toFixed(2)),
    zone: zone.name,
    message: "Delivery available",
  };
};
