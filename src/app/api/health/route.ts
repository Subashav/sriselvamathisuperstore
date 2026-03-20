import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({
    service: "Tamil Nadu Superstore API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
