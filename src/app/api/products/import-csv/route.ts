import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { csvImportSchema } from "@/lib/validation/product";
import { importProductsFromCsv } from "@/modules/products/product.service";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await parseJson(request);
    const input = csvImportSchema.parse(body);

    const result = await importProductsFromCsv(input.csv, input.defaultCategoryId, input.defaultSubCategoryId);
    return ok(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
