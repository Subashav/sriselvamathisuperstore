import { revalidatePath } from "next/cache";
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

async function createCategoryAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return;
  }

  const slug = slugifyLabel(name);
  if (!slug) {
    return;
  }

  await prisma.category.upsert({
    where: { slug },
    create: {
      name,
      slug,
      description: description || null,
      isActive: true,
    },
    update: {
      name,
      description: description || null,
      isActive: true,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
}

async function addSubCategoryAction(formData: FormData) {
  "use server";

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!categoryId || !name) {
    return;
  }

  const slug = slugifyLabel(name);
  if (!slug) {
    return;
  }

  await prisma.subCategory.upsert({
    where: {
      categoryId_slug: {
        categoryId,
        slug,
      },
    },
    create: {
      categoryId,
      name,
      slug,
      isActive: true,
    },
    update: {
      name,
      isActive: true,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
}

async function toggleCategoryStatusAction(formData: FormData) {
  "use server";

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) {
    return;
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { isActive: true } });
  if (!category) {
    return;
  }

  await prisma.category.update({ where: { id: categoryId }, data: { isActive: !category.isActive } });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
}

async function deleteCategoryAction(formData: FormData) {
  "use server";

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) {
    return;
  }

  const inUse = await prisma.product.count({ where: { categoryId } });
  if (inUse > 0) {
    await prisma.category.update({ where: { id: categoryId }, data: { isActive: false } });
  } else {
    await prisma.category.delete({ where: { id: categoryId } });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
}

async function toggleSubCategoryStatusAction(formData: FormData) {
  "use server";

  const subCategoryId = String(formData.get("subCategoryId") ?? "").trim();
  if (!subCategoryId) {
    return;
  }

  const subCategory = await prisma.subCategory.findUnique({ where: { id: subCategoryId }, select: { isActive: true } });
  if (!subCategory) {
    return;
  }

  await prisma.subCategory.update({ where: { id: subCategoryId }, data: { isActive: !subCategory.isActive } });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
}

async function deleteSubCategoryAction(formData: FormData) {
  "use server";

  const subCategoryId = String(formData.get("subCategoryId") ?? "").trim();
  if (!subCategoryId) {
    return;
  }

  const inUse = await prisma.product.count({ where: { subCategoryId } });
  if (inUse > 0) {
    await prisma.subCategory.update({ where: { id: subCategoryId }, data: { isActive: false } });
  } else {
    await prisma.subCategory.delete({ where: { id: subCategoryId } });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
}

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = getSingleParam(params.q).trim();
  const status = getSingleParam(params.status).trim();

  let dbOffline = false;
  let categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    _count: { products: number };
    subcategories: Array<{
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      _count: { products: number };
    }>;
  }> = [];

  try {
    categories = await prisma.category.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(status === "active" ? { isActive: true } : {}),
        ...(status === "inactive" ? { isActive: false } : {}),
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        subcategories: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
      },
    });
  } catch {
    dbOffline = true;
  }

  return (
    <main className="p-6 lg:p-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Taxonomy & Navigation</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Organize your products into logical categories and subcategories.</p>
        </div>

        {dbOffline ? (
          <article className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-amber-800">Database offline - Management functionality is limited.</p>
          </article>
        ) : null}

        {/* Global Search & Filter */}
        <form method="GET" className="mb-8 flex flex-wrap items-center gap-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search category or slug..."
            className="flex-1 min-w-[300px] rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold outline-none focus:border-amber-400 shadow-sm"
          />
          <select name="status" defaultValue={status} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold outline-none shadow-sm">
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button type="submit" className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-slate-900 shadow-lg shadow-amber-200/50 hover:bg-amber-400 transition-all">
            Filter
          </button>
          <a href="/admin/categories" className="rounded-2xl bg-white border border-slate-200 px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
            Reset
          </a>
        </form>

        {/* Create Form */}
        <form action={createCategoryAction} className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-slate-900">Add New Category</h3>
          <div className="grid gap-6 md:grid-cols-[1fr_2fr_auto]">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Category Name</label>
              <input name="name" required placeholder="e.g. Groceries" className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Description</label>
              <input name="description" placeholder="Brief overview of items in this category..." className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-black text-white shadow-xl hover:bg-slate-800 active:scale-95">
                Create Category
              </button>
            </div>
          </div>
        </form>

        <div className="grid gap-6">
          {categories.map((category) => (
            <article key={category.id} className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-amber-100">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="flex flex-1 items-center gap-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-2xl font-black text-slate-300">
                    📂
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{category.name}</h4>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      /{category.slug} • {category._count.products} Products
                    </p>
                    {category.description && <p className="mt-2 text-sm font-medium text-slate-500">{category.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <form action={toggleCategoryStatusAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button type="submit" className={`rounded-xl px-5 py-2.5 text-xs font-black transition-all ${
                      category.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    }`}>
                      {category.isActive ? "Active" : "Disabled"}
                    </button>
                  </form>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button type="submit" className="rounded-xl border border-slate-100 p-2.5 text-lg hover:bg-rose-50 hover:text-rose-600 active:scale-90">
                      🗑️
                    </button>
                  </form>
                </div>
              </div>

              {/* Subcategories Section */}
              <div className="mt-8 border-t border-slate-50 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sub-Categories Management</h5>
                  <form action={addSubCategoryAction} className="flex gap-2">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input
                      name="name"
                      required
                      placeholder="Add subcategory..."
                      className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold outline-none focus:border-amber-400 min-w-[200px]"
                    />
                    <button type="submit" className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 hover:bg-amber-500 hover:text-slate-900 transition-all">
                      Add
                    </button>
                  </form>
                </div>

                <div className="flex flex-wrap gap-3">
                  {category.subcategories.length ? (
                    category.subcategories.map((subCategory) => (
                      <div key={subCategory.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-amber-200">
                        <div className="flex flex-col">
                          <span className={`text-xs font-black ${subCategory.isActive ? "text-slate-900" : "text-slate-300 line-through"}`}>{subCategory.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{subCategory._count.products} Items</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2 border-l border-slate-100 pl-2">
                          <form action={toggleSubCategoryStatusAction}>
                            <input type="hidden" name="subCategoryId" value={subCategory.id} />
                            <button type="submit" className="p-1 text-[10px] opacity-40 hover:opacity-100 transition-opacity" title="Toggle Status">
                              {subCategory.isActive ? "👁️" : "👓"}
                            </button>
                          </form>
                          <form action={deleteSubCategoryAction}>
                            <input type="hidden" name="subCategoryId" value={subCategory.id} />
                            <button type="submit" className="p-1 text-[10px] opacity-40 hover:opacity-100 hover:text-rose-600 transition-all" title="Delete">
                              🗑️
                            </button>
                          </form>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-100 px-6 py-3">
                      <p className="text-xs font-bold text-slate-300">No subcategories defined.</p>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}

          {!categories.length && (
            <div className="rounded-3xl border-2 border-dashed border-slate-100 py-20 text-center">
              <p className="text-lg font-bold text-slate-400">No categories found in the system.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
