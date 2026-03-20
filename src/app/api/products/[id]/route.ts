import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { parseJson } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import { productUpdateSchema } from "@/lib/validation/product";
import { deleteProduct, getProductById, updateProduct } from "@/modules/products/product.service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    return ok({ product });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await parseJson(request);
    const input = productUpdateSchema.parse(body);
    const product = await updateProduct(id, input, admin.id);
    return ok({ product });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await deleteProduct(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
