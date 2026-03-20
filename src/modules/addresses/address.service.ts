import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

export const listAddresses = async (userId: string) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
};

export const createAddress = async (
  userId: string,
  input: {
    label?: string;
    fullName: string;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
  },
) => {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return tx.address.create({
      data: {
        userId,
        ...input,
      },
    });
  });
};

export const updateAddress = async (
  userId: string,
  addressId: string,
  input: Partial<{
    label?: string;
    fullName: string;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    phone: string;
    isDefault: boolean;
  }>,
) => {
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new AppError("Address not found", 404);
  }

  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return tx.address.update({
      where: { id: addressId },
      data: input,
    });
  });
};

export const deleteAddress = async (userId: string, addressId: string) => {
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) {
    throw new AppError("Address not found", 404);
  }

  await prisma.address.delete({ where: { id: addressId } });
  return true;
};
