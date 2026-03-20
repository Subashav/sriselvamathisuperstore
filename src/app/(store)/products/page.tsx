import Link from "next/link";
import { productFilterSchema } from "@/lib/validation/product";
import { prisma } from "@/lib/db/prisma";
import { listCatalogProducts } from "@/modules/products/product.service";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = (await searchParams) ?? {};
  const q = (getSingleParam(params.q) ?? "").trim();
  const categorySlug = (getSingleParam(params.categorySlug) ?? "").trim();
  const subCategorySlug = (getSingleParam(params.subCategorySlug) ?? "").trim();
  const sort = (getSingleParam(params.sort) ?? "latest").trim();

  const parsedFilters = productFilterSchema.safeParse({
    q: q || undefined,
    categorySlug: categorySlug || undefined,
    subCategorySlug: subCategorySlug || undefined,
    sort,
    page: 1,
    limit: 60,
  });

  const filters = parsedFilters.success
    ? parsedFilters.data
    : productFilterSchema.parse({
        q: q || undefined,
        categorySlug: categorySlug || undefined,
        subCategorySlug: subCategorySlug || undefined,
        sort: "latest",
        page: 1,
        limit: 60,
      });

  let dbOffline = false;
  let catalog: Awaited<ReturnType<typeof listCatalogProducts>> = {
    items: [],
    pagination: {
      page: 1,
      limit: 60,
      total: 0,
      totalPages: 0,
    },
  };

  let categories: Array<{
    name: string;
    slug: string;
    subcategories: Array<{ id: string; name: string; slug: string; isActive: boolean }>;
  }> = [];

  try {
    [catalog, categories] = await Promise.all([
      listCatalogProducts(filters),
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          name: true,
          slug: true,
          subcategories: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take: 8,
      }),
    ]);
  } catch {
    dbOffline = true;
  }

  const products = catalog.items;

  const buildProductsHref = (overrides: { q?: string; categorySlug?: string; subCategorySlug?: string; sort?: string }) => {
    const nextQ = overrides.q ?? q;
    const nextCategory = overrides.categorySlug ?? categorySlug;
    const nextSubCategory = overrides.subCategorySlug ?? subCategorySlug;
    const nextSort = overrides.sort ?? filters.sort;

    const nextParams = new URLSearchParams();
    if (nextQ) {
      nextParams.set("q", nextQ);
    }
    if (nextCategory) {
      nextParams.set("categorySlug", nextCategory);
    }
    if (nextSubCategory) {
      nextParams.set("subCategorySlug", nextSubCategory);
    }
    if (nextSort && nextSort !== "latest") {
      nextParams.set("sort", nextSort);
    }

    const queryString = nextParams.toString();
    return queryString ? `/products?${queryString}` : "/products";
  };

  const navPills = [{ label: "All", slug: "" }, ...categories.map((category) => ({ label: category.name, slug: category.slug }))];

  const selectedCategoryMeta = categories.find((item) => item.slug === categorySlug);
  const selectedSubcategories = selectedCategoryMeta?.subcategories ?? [];

  const sortPills = [
    { label: "Latest", value: "latest" },
    { label: "Price Low-High", value: "price_asc" },
    { label: "Price High-Low", value: "price_desc" },
    { label: "Popular", value: "popular" },
  ] as const;

  const selectedCategoryLabel = categorySlug ? categories.find((item) => item.slug === categorySlug)?.name ?? "Category" : "All";
  const selectedSubCategoryLabel = subCategorySlug
    ? selectedSubcategories.find((item) => item.slug === subCategorySlug)?.name ?? "Subcategory"
    : "All";
  const resultHeading = categorySlug ? `Category: ${selectedCategoryLabel}` : "All Products";
  const resultDescription = q
    ? `Showing results for \"${q}\"${categorySlug ? " in selected category" : ""}${subCategorySlug ? " and subcategory" : ""}.`
    : "Explore active products across all categories.";
  const hasFilters = Boolean(q || categorySlug || subCategorySlug || filters.sort !== "latest");
  const resultCountText = `${catalog.pagination.total} product${catalog.pagination.total === 1 ? "" : "s"}`;

  return (
    <main className="uni-shell min-h-screen">
      <div className="uni-glow uni-glow-left" aria-hidden="true" />
      <div className="uni-glow uni-glow-right" aria-hidden="true" />

      <section className="bg-black px-4 py-2 text-[11px] text-white sm:px-7 sm:text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Service 4.9 out of 5</p>
          <p className="hidden text-center font-medium md:block">Call us | +91 98948-49778</p>
          <p className="font-semibold">Pro Members</p>
        </div>
      </section>

      <section className="bg-white px-4 pb-8 pt-4 sm:px-7">
        <header className="border-b border-[#efefef] pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-3xl font-black tracking-tight text-[#121212]">
              superstore
            </Link>
            <form action="/products" className="hidden flex-1 items-center gap-2 md:flex">
              <input
                name="q"
                placeholder="Search products"
                defaultValue={q}
                className="w-full rounded-full border border-[#ececec] bg-[#fafafa] px-4 py-2 text-sm text-[#444] outline-none focus:border-[#cfd8df]"
              />
              <input type="hidden" name="categorySlug" value={categorySlug} />
              <input type="hidden" name="subCategorySlug" value={subCategorySlug} />
              <input type="hidden" name="sort" value={filters.sort} />
              <button type="submit" className="rounded-full bg-[#18a6d1] px-4 py-2 text-xs font-bold text-white">
                Search
              </button>
            </form>
            <Link href="/cart" className="ml-auto text-sm font-semibold text-[#474747]">
              Cart
            </Link>
            <Link href="/checkout" className="text-sm font-semibold text-[#474747]">
              Checkout
            </Link>
            <Link href="/orders" className="text-sm font-semibold text-[#474747]">
              Orders
            </Link>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navPills.map((item) => (
              <Link
                key={item.slug || "all"}
                href={buildProductsHref({ categorySlug: item.slug })}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  categorySlug === item.slug
                    ? "border-[#ffcece] bg-[#fff5f5] text-[#f15252]"
                    : "border-[#ececec] bg-[#fafafa] text-[#787878]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="mx-auto mt-6 max-w-[1320px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-[#1a1a1a]">{resultHeading}</h1>
              <p className="mt-1 text-sm text-[#707070]">{resultDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-2 text-sm font-semibold text-[#505050]">
                {resultCountText}
              </span>
              <span className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-2 text-sm font-semibold text-[#505050]">
                {selectedCategoryLabel}
              </span>
              <span className="rounded-xl border border-[#ececec] bg-[#fafafa] px-4 py-2 text-sm font-semibold text-[#505050]">
                {selectedSubCategoryLabel}
              </span>
              <Link href="/" className="rounded-xl border border-[#dfdfdf] px-4 py-2 text-sm font-semibold text-[#373737]">
                Home
              </Link>
              <Link href="/cart" className="rounded-xl bg-[#f97316] px-4 py-2 text-sm font-black text-[#1d1d1d]">
                Go to Cart
              </Link>
            </div>
          </div>

          {dbOffline ? (
            <article className="mt-4 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-3 text-sm font-semibold text-[#9a5a17]">
              Database is currently offline. Product filters will become live once PostgreSQL is available.
            </article>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {sortPills.map((item) => (
              <Link
                key={item.value}
                href={buildProductsHref({ sort: item.value })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  filters.sort === item.value
                    ? "border-[#212121] bg-[#212121] text-white"
                    : "border-[#e6e6e6] bg-white text-[#666]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {hasFilters ? (
              <Link href={buildProductsHref({ q: "", categorySlug: "", subCategorySlug: "", sort: "latest" })} className="rounded-full border border-[#e6e6e6] bg-white px-3 py-1 text-xs font-semibold text-[#666]">
                Clear filters
              </Link>
            ) : null}
          </div>

          {selectedSubcategories.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {selectedSubcategories.map((subCategory) => (
                <Link
                  key={subCategory.id}
                  href={buildProductsHref({ subCategorySlug: subCategory.slug })}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    subCategorySlug === subCategory.slug
                      ? "border-[#212121] bg-[#212121] text-white"
                      : "border-[#e6e6e6] bg-white text-[#666]"
                  }`}
                >
                  {subCategory.name}
                </Link>
              ))}
            </div>
          ) : null}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <article
                key={product.id}
                className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
              >
                <span className="inline-flex rounded-md bg-[#ff4e4e] px-2 py-1 text-[10px] font-black text-white">Offer</span>
                <div className="mt-2 h-32 rounded-xl bg-[linear-gradient(135deg,#f5f5f5_0%,#ececec_100%)]" />
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6e6e6e]">{product.category.name}</p>
                <h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-extrabold text-[#202020]">{product.name}</h2>
                <p className="mt-2 text-lg font-black text-[#f04747]">INR {product.price.toString()}</p>
                <p className="text-xs text-[#9a9a9a] line-through">INR {product.mrp.toString()}</p>
                <div className="mt-3 flex gap-2">
                  <Link href="/cart" className="flex-1 rounded-lg bg-[#f97316] px-3 py-2 text-center text-xs font-black text-[#171717]">
                    Add
                  </Link>
                  <Link href="/checkout" className="flex-1 rounded-lg border border-[#dfdfdf] px-3 py-2 text-center text-xs font-bold text-[#454545]">
                    Buy Now
                  </Link>
                </div>
                <p className="mt-2 text-[11px] text-[#6e6e6e]">{product.subCategory?.name ?? "General"}</p>
              </article>
            ))}
          </section>

          {products.length === 0 ? (
            <article className="mt-6 rounded-2xl border border-dashed border-[#d8d8d8] bg-white p-6 text-sm text-[#666]">
              No products match this filter. Try a different category or clear filters.
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}

