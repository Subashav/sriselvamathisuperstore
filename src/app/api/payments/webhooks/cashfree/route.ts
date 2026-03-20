import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const payloadObj = await parseJson<Record<string, unknown>>(request);
    const payload = payloadObj as Prisma.InputJsonValue;
    const eventId = String(payloadObj.eventId ?? payloadObj.cf_event_id ?? crypto.randomUUID());
    const eventType = String(payloadObj.eventType ?? payloadObj.type ?? "unknown");

    await prisma.webhookEvent.upsert({
      where: { eventId },
      update: {
        payload,
        eventType,
        isVerified: true,
        processedAt: new Date(),
      },
      create: {
        provider: "CASHFREE",
        eventId,
        eventType,
        payload,
        isVerified: true,
        processedAt: new Date(),
      },
    });

    return ok({ received: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
