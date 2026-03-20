import { addDays } from "date-fns";
import { nanoid } from "nanoid";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

const isProd = process.env.NODE_ENV === "production";

export async function POST() {
  const token = nanoid(28);
  const expiresAt = addDays(new Date(), 7);

  await prisma.guestSession.create({
    data: {
      token,
      expiresAt,
    },
  });

  const response = ok({ message: "Guest checkout session ready" }, 201);

  response.cookies.set("tn_guest_session", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return response;
}
