import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { productCreateSchema, productFilterSchema } from "@/lib/validation/product";
import { createProduct, listAdminProducts, listCatalogProducts } from "@/modules/products/product.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "admin") {
      await requireAdmin(request);
      const products = await listAdminProducts();
      return ok({ products });
    }

    const filters = productFilterSchema.parse({
      q: searchParams.get("q") ?? undefined,
      categorySlug: searchParams.get("categorySlug") ?? undefined,
      subCategorySlug: searchParams.get("subCategorySlug") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
      featured: searchParams.get("featured") ?? undefined,
      sort: searchParams.get("sort") ?? "latest",
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    const result = await listCatalogProducts(filters);
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const body = await parseJson(request);
    const input = productCreateSchema.parse(body);
    const product = await createProduct(input);

    await Promise.resolve(admin.id);
    return ok({ product }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
