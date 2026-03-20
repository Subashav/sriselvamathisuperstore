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
    throw new Error("Minimum 2 images are required to create a product.");
  }

  const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  for (const file of uploadedFiles) {
    if (!allowedMimeTypes.has(file.type)) {
      throw new Error("Only JPG, PNG, and WEBP images are allowed.");
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
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5 rounded-3xl border border-[#e6e6e6] bg-white p-6 shadow-[0_16px_38px_rgba(0,0,0,0.06)]">
        <div>
          <h2 className="text-3xl font-black text-[#1d1d1d]">Product Control Center</h2>
          <p className="mt-1 text-sm text-[#666]">Create unlimited categories and products with direct image upload. Minimum 2 product images required.</p>
        </div>

        {dbOffline ? (
          <article className="rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-3 text-sm font-semibold text-[#9a5a17]">
            Database is not reachable right now. Product management actions are temporarily unavailable.
          </article>
        ) : null}

        <form action={createProductAction} encType="multipart/form-data" className="grid gap-3 rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 lg:grid-cols-4">
          <input name="name" required placeholder="Product name" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none" />
          <input name="sku" placeholder="SKU (optional)" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none" />
          <input name="price" type="number" step="0.01" required placeholder="Price" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none" />
          <input name="mrp" type="number" step="0.01" required placeholder="MRP" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none" />
          <input name="stock" type="number" required placeholder="Stock" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none" />
          <input name="minStock" type="number" required placeholder="Min stock" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none" />
          <input name="gstRate" type="number" step="0.01" defaultValue={5} placeholder="GST %" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none" />
          <select name="status" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none" defaultValue="ACTIVE">
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <select name="categoryId" required className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none">
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="subCategoryId" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none">
            <option value="">Select subcategory (optional)</option>
            {categories.map((category) =>
              category.subcategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>
                  {category.name} / {subCategory.name}
                </option>
              )),
            )}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm font-semibold text-[#444]">
            <input type="checkbox" name="isFeatured" />
            Featured Product
          </label>
          <button type="submit" className="rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white">
            Create Product
          </button>
          <textarea name="description" required placeholder="Product description" className="min-h-24 rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none lg:col-span-2" />
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-[#666]">Upload Images (minimum 2)</label>
            <input
              name="images"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              required
              className="w-full rounded-xl border border-[#dfdfdf] bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
        </form>

        <form method="GET" className="grid gap-3 rounded-2xl border border-[#ececec] p-4 md:grid-cols-6">
          <input name="q" defaultValue={q} placeholder="Search name/SKU" className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none md:col-span-2" />
          <select name="categoryId" defaultValue={categoryId} className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="subCategoryId" defaultValue={subCategoryId} className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none">
            <option value="">All subcategories</option>
            {allSubcategories.map((subCategory) => (
              <option key={subCategory.id} value={subCategory.id}>
                {subCategory.name}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={status} className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none">
            <option value="">All status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <select name="featured" defaultValue={featured} className="rounded-xl border border-[#dfdfdf] px-3 py-2 text-sm outline-none">
            <option value="">Featured: Any</option>
            <option value="true">Featured only</option>
            <option value="false">Non-featured only</option>
          </select>
          <button type="submit" className="rounded-xl bg-[#ffcc17] px-4 py-2 text-sm font-black text-[#111] md:col-span-2">Apply Filters</button>
          <a href="/admin/products" className="rounded-xl border border-[#dfdfdf] px-4 py-2 text-center text-sm font-semibold text-[#444] md:col-span-2">Clear</a>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl bg-[#f6f6f6] p-4">
            <p className="text-xs font-bold uppercase text-[#666]">Total Products</p>
            <p className="mt-2 text-2xl font-black text-[#111]">{products.length}</p>
          </article>
          <article className="rounded-xl bg-[#f6f6f6] p-4">
            <p className="text-xs font-bold uppercase text-[#666]">Active</p>
            <p className="mt-2 text-2xl font-black text-[#111]">{products.filter((item) => item.status === "ACTIVE").length}</p>
          </article>
          <article className="rounded-xl bg-[#f6f6f6] p-4">
            <p className="text-xs font-bold uppercase text-[#666]">Low Stock</p>
            <p className="mt-2 text-2xl font-black text-[#111]">{products.filter((item) => item.stock <= item.minStock).length}</p>
          </article>
          <article className="rounded-xl bg-[#f6f6f6] p-4">
            <p className="text-xs font-bold uppercase text-[#666]">Featured</p>
            <p className="mt-2 text-2xl font-black text-[#111]">{products.filter((item) => item.isFeatured).length}</p>
          </article>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#ececec]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fafafa]">
              <tr className="border-b border-[#ececec] text-xs uppercase tracking-[0.08em] text-[#666]">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Subcategory</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Demand</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                return (
                  <Fragment key={product.id}>
                    <tr key={`${product.id}-summary`} className="border-b border-[#f0f0f0] align-top">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {product.images[0]?.imageUrl ? (
                            <img src={product.images[0].imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-[#f1f1f1]" />
                          )}
                          <div>
                            <p className="font-bold text-[#1f1f1f]">{product.name}</p>
                            <p className="text-xs text-[#777]">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#333]">{product.category.name}</td>
                      <td className="px-3 py-3 text-[#333]">{product.subCategory?.name ?? "-"}</td>
                      <td className="px-3 py-3"><span className="rounded-full bg-[#f4f4f4] px-2 py-1 text-xs font-bold text-[#333]">{product.status}</span></td>
                      <td className="px-3 py-3">
                        <p className={`font-black ${isLowStock ? "text-[#c65c00]" : "text-[#111]"}`}>{product.stock}</p>
                        <p className="text-xs text-[#777]">Min {product.minStock}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-black text-[#111]">INR {product.price.toString()}</p>
                        <p className="text-xs text-[#888] line-through">INR {product.mrp.toString()}</p>
                      </td>
                      <td className="px-3 py-3 text-[#333]">{product._count.orderItems} orders</td>
                      <td className="px-3 py-3 text-xs text-[#777]">{new Date(product.updatedAt).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-3">
                        <form action={deleteProductAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <button type="submit" className="rounded-lg border border-[#f0d1d1] px-2 py-1 text-xs font-bold text-[#a54848]">Delete</button>
                        </form>
                      </td>
                    </tr>
                    <tr key={`${product.id}-edit`} className="border-b border-[#ececec] bg-[#fcfcfc]">
                      <td className="px-3 py-3" colSpan={9}>
                        <form action={updateProductAction} className="grid gap-2 md:grid-cols-5 xl:grid-cols-10">
                          <input type="hidden" name="id" value={product.id} />
                          <input name="name" defaultValue={product.name} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs" />
                          <input name="sku" defaultValue={product.sku} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs" />
                          <input name="price" type="number" step="0.01" defaultValue={Number(product.price).toString()} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs" />
                          <input name="mrp" type="number" step="0.01" defaultValue={Number(product.mrp).toString()} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs" />
                          <input name="stock" type="number" defaultValue={product.stock} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs" />
                          <input name="minStock" type="number" defaultValue={product.minStock} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs" />
                          <input name="gstRate" type="number" step="0.01" defaultValue={Number(product.gstRate).toString()} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs" />
                          <select name="status" defaultValue={product.status} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                          <label className="flex items-center gap-1 rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs font-semibold text-[#444]">
                            <input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} />
                            Featured
                          </label>
                          <select name="categoryId" defaultValue={product.category.id} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs md:col-span-2">
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <select name="subCategoryId" defaultValue={product.subCategory?.id ?? ""} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs md:col-span-2">
                            <option value="">No subcategory</option>
                            {categories.map((category) =>
                              category.subcategories.map((subCategory) => (
                                <option key={subCategory.id} value={subCategory.id}>
                                  {category.name} / {subCategory.name}
                                </option>
                              )),
                            )}
                          </select>
                          <input name="description" defaultValue={product.description} className="rounded-lg border border-[#dfdfdf] px-2 py-1.5 text-xs md:col-span-4 xl:col-span-5" />
                          <button type="submit" className="rounded-lg bg-[#1768d6] px-3 py-1.5 text-xs font-bold text-white md:col-span-1">
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
