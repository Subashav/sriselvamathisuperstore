import { NextRequest } from "next/server";
import { z } from "zod";
import { AppError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  orderId: z.string().cuid(),
  provider: z.enum(["RAZORPAY", "CASHFREE"]).default("RAZORPAY"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = await parseJson(request);
    const input = schema.parse(body);

    const order = await prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order || order.userId !== user.id) {
      throw new AppError("Order not found", 404);
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: input.provider,
        amount: order.totalAmount,
        status: "CREATED",
      },
    });

    return ok({
      transaction,
      paymentIntent: {
        provider: input.provider,
        providerOrderId: `${input.provider}-${order.orderNumber}`,
        amount: order.totalAmount,
      },
    }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
