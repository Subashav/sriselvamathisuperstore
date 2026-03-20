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
    <main className="p-6 lg:p-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Products Inventory</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Add, update, and manage your store's catalog.</p>
        </div>

        {dbOffline ? (
          <article className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-amber-800">Database offline - Management functionality is limited.</p>
          </article>
        ) : null}

        {/* Create Form */}
        <form action={createProductAction} className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-slate-900">Add New Product</h3>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Product Name</label>
              <input name="name" required placeholder="e.g. Basmati Rice" className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">SKU</label>
              <input name="sku" placeholder="Optional" className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Selling Price</label>
              <input name="price" type="number" step="0.01" required placeholder="0.00" className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">MRP</label>
              <input name="mrp" type="number" step="0.01" required placeholder="0.00" className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Current Stock</label>
              <input name="stock" type="number" required placeholder="0" className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Min Stock Warning</label>
              <input name="minStock" type="number" required placeholder="5" className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Status</label>
              <select name="status" className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" defaultValue="ACTIVE">
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Category</label>
              <select name="categoryId" required className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400">
                <option value="">Select...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Images (Minimum 2 required)</label>
              <input name="images" type="file" accept="image/png,image/jpeg,image/webp" multiple required className="block w-full text-xs font-bold rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-pointer" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Short Description</label>
              <textarea name="description" required placeholder="Describe the product..." className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" rows={1} />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button type="submit" className="rounded-2xl bg-slate-900 px-10 py-4 text-sm font-black text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95">
              🚀 Create Product
            </button>
          </div>
        </form>

        {/* Filters */}
        <form method="GET" className="mb-10 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <input name="q" defaultValue={q} placeholder="Search name or SKU..." className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold outline-none focus:border-amber-400 shadow-sm" />
          </div>
          <select name="categoryId" defaultValue={categoryId} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold outline-none shadow-sm capitalize">
            <option value="">All Categories</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select name="status" defaultValue={status} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold outline-none shadow-sm">
            <option value="">Any Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button type="submit" className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-slate-900 shadow-lg shadow-amber-200/50 hover:bg-amber-400 transition-all">
            Apply Filters
          </button>
          <a href="/admin/products" className="rounded-2xl bg-white border border-slate-200 px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
            Reset
          </a>
        </form>

        {/* Stats */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Catalog Size", value: products.length, icon: "📊" },
            { label: "Active Items", value: products.filter(p => p.status === "ACTIVE").length, icon: "✅" },
            { label: "Critical Stock", value: products.filter(p => p.stock <= p.minStock).length, icon: "🚨", warning: true },
            { label: "Featured Deals", value: products.filter(p => p.isFeatured).length, icon: "✨" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p className={`mt-2 text-3xl font-black ${stat.warning ? "text-rose-600" : "text-slate-900"}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Product List */}
        <div className="space-y-4">
          {products.map((product) => {
            const isLowStock = product.stock <= product.minStock;
            return (
              <article key={product.id} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-amber-100 hover:shadow-md">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                  {/* Image & Main Info */}
                  <div className="flex flex-1 items-center gap-6">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {product.images[0]?.imageUrl ? (
                        <img src={product.images[0].imageUrl} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-300">📦</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-lg font-black text-slate-900">{product.name}</h4>
                        {product.isFeatured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black uppercase text-amber-600">Featured</span>}
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-widest">SKU: {product.sku}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">{product.category.name}</span>
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                          product.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}>{product.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock & Price */}
                  <div className="flex items-center gap-10 lg:px-10 lg:border-l lg:border-r lg:border-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Stock</p>
                      <p className={`mt-1 text-xl font-black ${isLowStock ? "text-rose-600" : "text-slate-900"}`}>{product.stock}</p>
                      <p className="text-[10px] font-medium text-slate-400">Min: {product.minStock}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Price (INR)</p>
                      <p className="mt-1 text-xl font-black text-slate-900">{product.price.toString()}</p>
                      <p className="text-[10px] font-medium text-slate-400 line-through">{product.mrp.toString()}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <button type="submit" className="rounded-xl border border-slate-100 p-3 text-xl transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-90" title="Delete Product">
                        🗑️
                      </button>
                    </form>
                    <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white hover:bg-slate-800">
                      ✏️ Edit
                    </button>
                  </div>
                </div>

                {/* Inline Edit Form (Simplified/Hidden by default - would need state but keeping for consistency) */}
                <details className="mt-6 border-t border-slate-50 pt-6">
                  <summary className="cursor-pointer text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500">Quick Edit Details</summary>
                  <form action={updateProductAction} className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    <input type="hidden" name="id" value={product.id} />
                    <input name="name" defaultValue={product.name} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-amber-400 col-span-2" />
                    <input name="price" type="number" step="0.01" defaultValue={Number(product.price).toString()} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-amber-400" />
                    <input name="stock" type="number" defaultValue={product.stock} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-amber-400" />
                    <select name="status" defaultValue={product.status} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-amber-400">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                    <button type="submit" className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-900 transition-all hover:bg-amber-400">
                      Save
                    </button>
                  </form>
                </details>
              </article>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="mt-10 rounded-3xl border-2 border-dashed border-slate-100 py-20 text-center">
            <p className="text-lg font-bold text-slate-400">No products found matching your search.</p>
          </div>
        )}
      </section>
    </main>
  );
}



