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
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-[#113d78]">Category Management</h2>
        <p className="mt-2 text-sm text-[#58779a]">Manage categories and subcategories that power storefront navigation and filtering.</p>

        {dbOffline ? (
          <p className="mt-3 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-2 text-sm font-semibold text-[#9a5a17]">
            Database is offline. Category management will become active once PostgreSQL is available.
          </p>
        ) : null}

        <form method="GET" className="mt-4 grid gap-3 rounded-xl border border-[#deebfb] bg-[#f8fbff] p-4 sm:grid-cols-[2fr_1fr_auto_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search category/slug"
            className="rounded-lg border border-[#d7e5f8] px-3 py-2 text-sm outline-none focus:border-[#7ca8de]"
          />
          <select name="status" defaultValue={status} className="rounded-lg border border-[#d7e5f8] px-3 py-2 text-sm outline-none focus:border-[#7ca8de]">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="rounded-lg bg-[#111] px-4 py-2 text-sm font-bold text-white">
            Filter
          </button>
          <a href="/admin/categories" className="rounded-lg border border-[#d2e3f8] px-4 py-2 text-center text-sm font-bold text-[#1e4f8d]">
            Clear
          </a>
        </form>

        <form action={createCategoryAction} className="mt-5 grid gap-3 rounded-xl border border-[#deebfb] bg-[#f8fbff] p-4 sm:grid-cols-[2fr_3fr_auto]">
          <input
            name="name"
            required
            placeholder="Category name"
            className="rounded-lg border border-[#d7e5f8] px-3 py-2 text-sm outline-none focus:border-[#7ca8de]"
          />
          <input
            name="description"
            placeholder="Description"
            className="rounded-lg border border-[#d7e5f8] px-3 py-2 text-sm outline-none focus:border-[#7ca8de]"
          />
          <button type="submit" className="rounded-lg bg-[#1768d6] px-4 py-2 text-sm font-bold text-white">
            Add Category
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {categories.map((category) => (
            <article key={category.id} className="rounded-xl border border-[#e3ecfb] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-[#1f4f8b]">{category.name}</p>
                  <p className="text-xs text-[#6781a2]">
                    slug: {category.slug} | products: {category._count.products} | {category.isActive ? "Active" : "Inactive"}
                  </p>
                  {category.description ? <p className="mt-1 text-sm text-[#486789]">{category.description}</p> : null}
                </div>

                <div className="flex gap-2">
                  <form action={toggleCategoryStatusAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button type="submit" className="rounded-lg border border-[#d2e3f8] px-3 py-1.5 text-xs font-bold text-[#1e4f8d]">
                      {category.isActive ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <button type="submit" className="rounded-lg border border-[#f0d1d1] px-3 py-1.5 text-xs font-bold text-[#a54848]">
                      Delete
                    </button>
                  </form>
                </div>
              </div>

              <form action={addSubCategoryAction} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="categoryId" value={category.id} />
                <input
                  name="name"
                  required
                  placeholder="New subcategory"
                  className="min-w-52 flex-1 rounded-lg border border-[#d7e5f8] px-3 py-2 text-sm outline-none focus:border-[#7ca8de]"
                />
                <button type="submit" className="rounded-lg bg-[#1768d6] px-4 py-2 text-sm font-bold text-white">
                  Add Subcategory
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                {category.subcategories.length ? (
                  category.subcategories.map((subCategory) => (
                    <div key={subCategory.id} className="inline-flex items-center gap-2 rounded-full border border-[#dbe8fa] bg-[#f7fbff] px-3 py-1.5 text-xs">
                      <span className={`font-bold ${subCategory.isActive ? "text-[#1e4f8d]" : "text-[#8399b4]"}`}>{subCategory.name}</span>
                      <span className="text-[#8399b4]">({subCategory._count.products})</span>
                      <form action={toggleSubCategoryStatusAction}>
                        <input type="hidden" name="subCategoryId" value={subCategory.id} />
                        <button type="submit" className="font-bold text-[#4c77a8]">
                          {subCategory.isActive ? "Hide" : "Show"}
                        </button>
                      </form>
                      <form action={deleteSubCategoryAction}>
                        <input type="hidden" name="subCategoryId" value={subCategory.id} />
                        <button type="submit" className="font-bold text-[#b45252]">
                          Remove
                        </button>
                      </form>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#6781a2]">No subcategories yet.</p>
                )}
              </div>
            </article>
          ))}

          {!categories.length ? (
            <article className="rounded-xl border border-dashed border-[#d3e3f8] bg-[#f8fbff] p-4 text-sm text-[#58779a]">
              No categories available. Add your first category above.
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
