import type { NextRequest } from "next/server";

export const getClientIdentifier = (request: NextRequest) => {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  return forwardedFor || realIp || "unknown";
};
