import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Fragment } from "react";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { slugifyLabel } from "@/modules/categories/taxonomy";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function getImageExtension(file: File): string {
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/jpeg") return ".jpg";

  const parsed = path.extname(file.name || "").toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(parsed)) {
    return parsed === ".jpeg" ? ".jpg" : parsed;
  }

  return ".jpg";
}

async function saveUploadedProductImage(file: File): Promise<string> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadsDir, { recursive: true });

  const extension = getImageExtension(file);
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadsDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return `/uploads/products/${fileName}`;
}

async function createProductAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const subCategoryIdRaw = String(formData.get("subCategoryId") ?? "").trim();
  const skuRaw = String(formData.get("sku") ?? "").trim();
  const uploadedFiles = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const price = Number(formData.get("price") ?? 0);
  const mrp = Number(formData.get("mrp") ?? 0);
  const gstRate = Number(formData.get("gstRate") ?? 5);
  const stock = Number(formData.get("stock") ?? 0);
  const minStock = Number(formData.get("minStock") ?? 0);
  const status = String(formData.get("status") ?? "ACTIVE") as ProductStatus;
  const isFeatured = String(formData.get("isFeatured") ?? "") === "on";

  if (!Object.values(ProductStatus).includes(status)) {
    return;
  }

  if (!name || !description || !categoryId || Number.isNaN(price) || Number.isNaN(mrp)) {
    return;
  }

  if (uploadedFiles.length < 2) {
    return;
  }

  const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  for (const file of uploadedFiles) {
    if (!allowedMimeTypes.has(file.type)) {
      return;
    }
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    return;
  }

  const subCategoryId = subCategoryIdRaw || undefined;

  if (subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      select: { id: true, categoryId: true },
    });

    if (!subCategory || subCategory.categoryId !== categoryId) {
      return;
    }
  }

  const slugBase = slugifyLabel(name);
  if (!slugBase) {
    return;
  }

  const uniqueTail = Date.now().toString().slice(-6);
  const imageUrls = await Promise.all(uploadedFiles.map((file) => saveUploadedProductImage(file)));

  await prisma.product.create({
    data: {
      name,
      slug: `${slugBase}-${uniqueTail}`,
      sku: skuRaw || `SKU-${uniqueTail}`,
      description,
      categoryId,
      subCategoryId,
      price,
      mrp,
      gstRate,
      stock,
      minStock,
      status,
      isFeatured,
      images: {
        create: imageUrls.map((imageUrl, index) => ({ imageUrl, sortOrder: index })),
      },
      inventoryLogs: {
        create: {
          deltaQty: stock,
          reason: "INITIAL_STOCK",
        },
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

async function updateProductAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const subCategoryIdRaw = String(formData.get("subCategoryId") ?? "").trim();

  const price = Number(formData.get("price") ?? 0);
  const mrp = Number(formData.get("mrp") ?? 0);
  const gstRate = Number(formData.get("gstRate") ?? 5);
  const stock = Number(formData.get("stock") ?? 0);
  const minStock = Number(formData.get("minStock") ?? 0);
  const statusRaw = String(formData.get("status") ?? "ACTIVE");
  const isFeatured = String(formData.get("isFeatured") ?? "") === "on";

  if (!id || !name || !sku || !description || !categoryId) {
    return;
  }

  if ([price, mrp, gstRate, stock, minStock].some((value) => Number.isNaN(value))) {
    return;
  }

  if (!Object.values(ProductStatus).includes(statusRaw as ProductStatus)) {
    return;
  }

  const status = statusRaw as ProductStatus;
  const subCategoryId = subCategoryIdRaw || null;

  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    return;
  }

  if (subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      select: { id: true, categoryId: true },
    });

    if (!subCategory || subCategory.categoryId !== categoryId) {
      return;
    }
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { stock: true },
  });

  if (!existing) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        categoryId,
        subCategoryId,
        price,
        mrp,
        gstRate,
        stock,
        minStock,
        status,
        isFeatured,
      },
    });

    if (stock !== existing.stock) {
      await tx.inventoryMovement.create({
        data: {
          productId: id,
          deltaQty: stock - existing.stock,
          reason: "STOCK_ADJUSTMENT",
        },
      });
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

async function deleteProductAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return;
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = getSingleParam(params.q).trim();
  const categoryId = getSingleParam(params.categoryId).trim();
  const subCategoryId = getSingleParam(params.subCategoryId).trim();
  const status = getSingleParam(params.status).trim();
  const featured = getSingleParam(params.featured).trim();

  let dbOffline = false;
  let categories: Array<{
    id: string;
    name: string;
    subcategories: Array<{ id: string; name: string }>;
  }> = [];

  let products: Array<{
    id: string;
    name: string;
    description: string;
    sku: string;
    status: ProductStatus;
    gstRate: { toString(): string };
    stock: number;
    minStock: number;
    price: { toString(): string };
    mrp: { toString(): string };
    isFeatured: boolean;
    category: { id: string; name: string };
    subCategory: { id: string; name: string } | null;
    images: Array<{ imageUrl: string }>;
    _count: { orderItems: number; reviews: number };
    updatedAt: Date;
  }> = [];

  try {
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        subcategories: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    });

    const where: Prisma.ProductWhereInput = {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(subCategoryId ? { subCategoryId } : {}),
      ...(status ? { status: status as ProductStatus } : {}),
      ...(featured === "true" ? { isFeatured: true } : {}),
      ...(featured === "false" ? { isFeatured: false } : {}),
    };

    products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { imageUrl: true },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    dbOffline = true;
  }

  const allSubcategories = categories.flatMap((category) => category.subcategories);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-yellow-500">Products</h2>
          <p className="mt-1 text-sm text-gray-600">Manage products with direct image upload. Minimum 2 images required.</p>
        </div>

        {dbOffline ? (
          <article className="mb-6 rounded-lg border-l-4 border-orange-500 bg-white p-4">
            <p className="text-sm font-semibold text-orange-600">Database offline - Management unavailable</p>
          </article>
        ) : null}

        <form action={createProductAction} className="mb-6 rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">Create New Product</h3>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
            <input name="name" required placeholder="Product name" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
            <input name="sku" placeholder="SKU" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
            <input name="price" type="number" step="0.01" required placeholder="Price" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
            <input name="mrp" type="number" step="0.01" required placeholder="MRP" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
            <input name="stock" type="number" required placeholder="Stock" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
            <input name="minStock" type="number" required placeholder="Min stock" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
            <input name="gstRate" type="number" step="0.01" defaultValue={5} placeholder="GST %" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
            <select name="status" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" defaultValue="ACTIVE">
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <select name="categoryId" required className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200">
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select name="subCategoryId" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200">
              <option value="">Optional subcategory</option>
              {categories.map((category) =>
                category.subcategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>{category.name} / {subCategory.name}</option>
                )),
              )}
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-yellow-50 cursor-pointer transition-colors">
              <input type="checkbox" name="isFeatured" />
              Featured
            </label>
            <textarea name="description" required placeholder="Description" className="min-h-10 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200 md:col-span-2 lg:col-span-3" />
            <div className="md:col-span-1 lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600 uppercase">Images (min 2)</label>
              <input name="images" type="file" accept="image/png,image/jpeg,image/webp" multiple required className="block w-full text-sm rounded-lg border border-gray-200 px-3 py-2" />
            </div>
            <button type="submit" className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-400 transition-colors md:col-span-1">
              Create
            </button>
          </div>
        </form>

        <form method="GET" className="mb-6 rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Filters</h3>
          <div className="grid gap-3 md:grid-cols-6">
            <input name="q" defaultValue={q} placeholder="Search name/SKU" className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200 md:col-span-2" />
            <select name="categoryId" defaultValue={categoryId} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select name="subCategoryId" defaultValue={subCategoryId} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200">
              <option value="">All subcategories</option>
              {allSubcategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
              ))}
            </select>
            <select name="status" defaultValue={status} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200">
              <option value="">All status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <select name="featured" defaultValue={featured} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200">
              <option value="">Any featured</option>
              <option value="true">Featured only</option>
              <option value="false">Non-featured</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-400 transition-colors">
                Filter
              </button>
              <a href="/admin/products" className="flex-1 rounded-lg bg-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-300 transition-colors">
                Clear
              </a>
            </div>
          </div>
        </form>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-600">Total Products</p>
            <p className="mt-2 text-2xl font-bold text-yellow-500">{products.length}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-600">Active</p>
            <p className="mt-2 text-2xl font-bold text-yellow-500">{products.filter((item) => item.status === "ACTIVE").length}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-600">Low Stock</p>
            <p className="mt-2 text-2xl font-bold text-orange-600">{products.filter((item) => item.stock <= item.minStock).length}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-600">Featured</p>
            <p className="mt-2 text-2xl font-bold text-yellow-500">{products.filter((item) => item.isFeatured).length}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto rounded-lg bg-white border border-gray-200 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subcategory</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                return (
                  <Fragment key={product.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {product.images[0]?.imageUrl ? (
                            <img src={product.images[0].imageUrl} alt={product.name} className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{product.category.name}</td>
                      <td className="px-4 py-3 text-gray-700">{product.subCategory?.name ?? "-"}</td>
                      <td className="px-4 py-3"><span className="inline-block rounded px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-500">{product.status}</span></td>
                      <td className="px-4 py-3">
                        <p className={`font-bold ${isLowStock ? "text-orange-600" : "text-slate-900"}`}>{product.stock}</p>
                        <p className="text-xs text-gray-500">Min {product.minStock}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">INR {product.price.toString()}</p>
                        <p className="text-xs text-gray-500 line-through">INR {product.mrp.toString()}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{product._count.orderItems}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(product.updatedAt).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <form action={deleteProductAction} className="inline">
                          <input type="hidden" name="id" value={product.id} />
                          <button type="submit" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">Delete</button>
                        </form>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3" colSpan={9}>
                        <form action={updateProductAction} className="grid gap-2 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-10">
                          <input type="hidden" name="id" value={product.id} />
                          <input name="name" defaultValue={product.name} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
                          <input name="sku" defaultValue={product.sku} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
                          <input name="price" type="number" step="0.01" defaultValue={Number(product.price).toString()} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
                          <input name="mrp" type="number" step="0.01" defaultValue={Number(product.mrp).toString()} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
                          <input name="stock" type="number" defaultValue={product.stock} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
                          <input name="minStock" type="number" defaultValue={product.minStock} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
                          <input name="gstRate" type="number" step="0.01" defaultValue={Number(product.gstRate).toString()} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200" />
                          <select name="status" defaultValue={product.status} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                          <label className="flex items-center gap-1 rounded border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-yellow-50 cursor-pointer">
                            <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} />
                            Featured
                          </label>
                          <select name="categoryId" defaultValue={product.category.id} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 md:col-span-1 lg:col-span-2">
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                          <select name="subCategoryId" defaultValue={product.subCategory?.id ?? ""} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 md:col-span-1 lg:col-span-2">
                            <option value="">No subcategory</option>
                            {categories.map((category) =>
                              category.subcategories.map((subCategory) => (
                                <option key={subCategory.id} value={subCategory.id}>{category.name} / {subCategory.name}</option>
                              )),
                            )}
                          </select>
                          <input name="description" defaultValue={product.description} className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-200 md:col-span-2 lg:col-span-3 xl:col-span-5" />
                          <button type="submit" className="rounded bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-yellow-400 transition-colors md:col-span-1">
                            Update
                          </button>
                        </form>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}



