import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import BannerCarousel from "@/components/banner-carousel";
import OfferStripTicker from "@/components/offer-strip-ticker";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbOffline = false;
  let categories: Array<{
    name: string;
    slug: string;
    description: string | null;
    subcategories: Array<{ id: string; name: string; slug: string; isActive: boolean }>;
  }> = [];
  let banners: Array<{ id: string; title: string; description?: string; imageUrl: string; bgColor: string; textColor: string; link?: string }> = [];
  let stripOffers: Array<{ id: string; title: string; description?: string; link?: string }> = [];

  try {
    const [categoriesData, bannersData] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          name: true,
          slug: true,
          description: true,
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
        take: 7,
      }),
      prisma.offerBanner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, title: true, description: true, imageUrl: true, bgColor: true, textColor: true, link: true },
      }),
    ]);
    categories = categoriesData;
    banners = bannersData.map(b => ({
      id: b.id,
      title: b.title,
      description: b.description || undefined,
      imageUrl: b.imageUrl,
      bgColor: b.bgColor,
      textColor: b.textColor,
      link: b.link || undefined,
    }));
    stripOffers = bannersData.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description || undefined,
      link: b.link || undefined,
    }));
  } catch {
    dbOffline = true;
  }

  const navPills = categories.length
    ? categories.map((category) => ({ label: category.name, slug: category.slug }))
    : [
        { label: "Mobiles & Wearables", slug: "" },
        { label: "TV & Smart Home", slug: "" },
        { label: "Computing", slug: "" },
        { label: "Home", slug: "" },
        { label: "Sports", slug: "" },
        { label: "Books", slug: "" },
        { label: "More", slug: "" },
      ];

  const tones = [
    "from-[#d7dcff] to-[#f0f4ff]",
    "from-[#c4efe8] to-[#effcf9]",
    "from-[#ffe2df] to-[#fff2f1]",
    "from-[#d8ebff] to-[#edf6ff]",
    "from-[#cee9e9] to-[#edf8f8]",
    "from-[#ffe7cc] to-[#fff4e9]",
  ];

  const categoryTiles = categories.length
    ? categories.slice(0, 6).map((category, index) => ({
        name: category.name,
        slug: category.slug,
        tone: tones[index % tones.length],
      }))
    : [
        { name: "Mobiles", slug: "", tone: tones[0] },
        { name: "Audio", slug: "", tone: tones[1] },
        { name: "Smartwatches", slug: "", tone: tones[2] },
        { name: "Laptops", slug: "", tone: tones[3] },
        { name: "Displays", slug: "", tone: tones[4] },
        { name: "Footwear", slug: "", tone: tones[5] },
      ];

  const subCategorySuggestions = categories.flatMap((category) => category.subcategories).slice(0, 6);

  const products = [
    { name: "True Wireless Earbuds Urban 1", price: "INR 11,100", old: "INR 14,500", rating: "4.8" },
    { name: "Portable Speaker Urban Box 2", price: "INR 17,500", old: "INR 21,300", rating: "4.6" },
    { name: "Coffee Maker Electric 12", price: "INR 16,000", old: "INR 19,800", rating: "4.7" },
    { name: "Classic Perfume 100ml", price: "INR 23,700", old: "INR 27,250", rating: "4.8" },
    { name: "Redmi Buds 4 Lite", price: "INR 10,995", old: "INR 14,900", rating: "4.8" },
  ];

  return (
    <div className="uni-shell min-h-screen">
      <div className="uni-glow uni-glow-left" aria-hidden="true" />
      <div className="uni-glow uni-glow-right" aria-hidden="true" />

      <main className="relative min-h-screen w-full bg-[#f6f6f6]">
        <section className="bg-black px-4 py-2 text-[11px] text-white sm:px-7 sm:text-xs">
          <div className="flex items-center justify-between gap-3">
            <p className="hidden font-semibold sm:block">Live Offers</p>
            <div className="min-w-0 flex-1">
              <OfferStripTicker offers={stripOffers} autoScrollInterval={5000} />
            </div>
            <p className="hidden font-semibold sm:block">Updated by Admin</p>
          </div>
        </section>

        <section className="bg-white px-4 pb-6 pt-4 sm:px-7 sm:pb-8">
          {dbOffline ? (
            <article className="mb-4 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-3 text-sm font-semibold text-[#9a5a17]">
              Database is currently offline. Category data from admin panel will appear once PostgreSQL is available.
            </article>
          ) : null}

          <header className="border-b border-[#efefef] pb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                aria-label="Open categories"
                className="rounded-full border border-[#ececec] p-2 text-sm text-[#707070]"
              >
                |||
              </Link>
              <Link href="/" className="text-3xl font-black tracking-tight text-[#121212]">
                superstore
              </Link>
              <form action="/products" className="hidden flex-1 items-center gap-2 md:flex">
                <input
                  name="q"
                  placeholder="Search products"
                  className="w-full rounded-full border border-[#ececec] bg-[#fafafa] px-4 py-2 text-sm text-[#444] outline-none focus:border-[#cfd8df]"
                />
                <button type="submit" className="rounded-full bg-[#18a6d1] px-4 py-2 text-xs font-bold text-white">
                  Search
                </button>
              </form>
              <Link href="/products" className="rounded-full bg-[#18a6d1] px-3 py-2 text-xs font-bold text-white md:hidden">
                Search
              </Link>
              <Link href="/products" className="ml-auto text-sm font-semibold text-[#474747]">
                Shop
              </Link>
              <Link href="/orders" className="hidden text-sm font-semibold text-[#474747] sm:block">
                Orders
              </Link>
              <Link href="/cart" className="hidden text-sm font-semibold text-[#474747] sm:block">
                Cart
              </Link>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {navPills.map((item) => (
                <Link
                  key={item.label}
                  href={item.slug ? `/products?categorySlug=${item.slug}` : "/products"}
                  className="whitespace-nowrap rounded-full border border-[#ececec] bg-[#fafafa] px-3 py-1 text-[11px] font-semibold text-[#787878]"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/products?sort=popular"
                className="rounded-full border border-[#ffcece] bg-[#fff5f5] px-3 py-1 text-[11px] font-bold text-[#f15252]"
              >
                Offers
              </Link>
            </nav>
          </header>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
            <section>
              {/* Banner Carousel */}
              {banners.length > 0 && <BannerCarousel banners={banners} autoScrollInterval={5000} />}

              <article className="hero-card relative overflow-hidden rounded-2xl border border-[#ecd44f] bg-[linear-gradient(130deg,#f6de48_0%,#f8e977_38%,#d8f6ff_100%)] px-6 py-7">
                <p className="text-4xl font-black leading-[1.05] text-[#151515] sm:text-5xl">
                  Your perfect gift
                  <br />
                  is waiting here
                </p>
                <Link href="/products" className="mt-6 inline-flex rounded-xl bg-white px-6 py-2 text-sm font-bold text-[#161616] shadow-sm">
                  View Products
                </Link>
                <div className="mt-6 flex items-center gap-5 text-xs font-semibold text-[#224f50]">
                  <span>UPI</span>
                  <span>Card</span>
                </div>
                <div className="headphone-band" aria-hidden="true" />
                <div className="headphone-cup" aria-hidden="true" />
              </article>

              <section className="mt-4 grid gap-3 rounded-2xl border border-[#efefef] bg-white p-3 sm:grid-cols-3">
                {[
                  ["300,000", "happy customers"],
                  ["150,000", "products"],
                  ["Excellent", "service"],
                ].map((stat) => (
                  <article key={stat[1]} className="rounded-xl bg-[#fafafa] px-4 py-3">
                    <p className="text-sm font-black text-[#1d1d1d]">{stat[0]}</p>
                    <p className="text-xs text-[#767676]">{stat[1]}</p>
                  </article>
                ))}
              </section>

              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-black text-[#171717]">Popular Categories</h2>
                  <Link href="/products" className="text-xs font-bold text-[#888]">
                    View all
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {categoryTiles.map((item) => (
                    <Link key={item.name} href={item.slug ? `/products?categorySlug=${item.slug}` : "/products"} className="text-center">
                      <div className={`mx-auto h-16 w-16 rounded-full bg-gradient-to-b ${item.tone} ring-1 ring-[#ebebeb]`} />
                      <p className="mt-2 text-xs font-semibold text-[#434343]">{item.name}</p>
                    </Link>
                  ))}
                </div>
              </section>

              {subCategorySuggestions.length ? (
                <section className="mt-4 flex flex-wrap gap-2">
                  {subCategorySuggestions.map((subCategory) => (
                    <Link
                      key={subCategory.id}
                      href={`/products?subCategorySlug=${encodeURIComponent(subCategory.slug)}`}
                      className="rounded-full border border-[#ececec] bg-white px-3 py-1 text-xs font-semibold text-[#707070]"
                    >
                      {subCategory.name}
                    </Link>
                  ))}
                </section>
              ) : null}

              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-black text-[#171717]">Best Sellers</h2>
                  <Link href="/products" className="text-xs font-bold text-[#888]">
                    All products
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {products.map((product, index) => (
                    <Link
                      key={product.name}
                      href="/products"
                      className="rounded-2xl border border-[#ececec] bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
                    >
                      <span className="inline-flex rounded-md bg-[#ff4e4e] px-2 py-1 text-[10px] font-black text-white">Offer</span>
                      <div className="mt-2 h-24 rounded-xl bg-[linear-gradient(135deg,#f5f5f5_0%,#ececec_100%)]" />
                      <h3 className="mt-3 text-xs font-bold leading-snug text-[#202020]">{product.name}</h3>
                      <p className="mt-2 text-base font-black text-[#f04747]">{product.price}</p>
                      <p className="text-[11px] text-[#949494] line-through">{product.old}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#767676]">Rating {product.rating}</p>
                      <span className="sr-only">Open product {index + 1}</span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mt-6 rounded-2xl border border-[#ececec] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#9a9a9a]">OFFER</p>
                    <p className="text-3xl font-black text-[#171717]">OF THE DAY</p>
                  </div>
                  <div className="flex gap-2">
                    {[
                      ["10", "Hours"],
                      ["33", "Minutes"],
                      ["39", "Seconds"],
                    ].map((slot) => (
                      <div key={slot[1]} className="min-w-20 rounded-lg border border-[#ededed] px-3 py-2 text-center">
                        <p className="text-xl font-black text-[#202020]">{slot[0]}</p>
                        <p className="text-[11px] text-[#8a8a8a]">{slot[1]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </section>

            <aside className="phone-showcase self-start rounded-[36px] border border-[#202020] bg-[#111] p-2 shadow-[0_24px_35px_rgba(0,0,0,0.35)] xl:sticky xl:top-8">
              <div className="rounded-[30px] bg-white p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-[#2c2c2c]">
                  <span>9:41</span>
                  <span>4G</span>
                </div>
                <p className="text-[10px] font-bold uppercase text-[#a6a6a6]">XIAOMI</p>
                <h3 className="mt-1 text-2xl font-black leading-tight text-[#191919]">Wireless Earbuds Redmi Buds 4 Lite</h3>
                <span className="mt-3 inline-flex rounded-md bg-[#ff4f4f] px-2 py-1 text-[10px] font-black text-white">Offer</span>
                <div className="mt-3 h-60 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#ececec_76%)]" />
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-black text-[#ef4f4f]">INR 10,995</p>
                    <p className="text-xs text-[#909090] line-through">INR 14,900</p>
                    <p className="mt-1 text-xs font-bold text-[#3a9d6d]">In stock</p>
                  </div>
                  <p className="text-xs font-semibold text-[#787878]">4.8 (23)</p>
                </div>
                <Link href="/cart" className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#ffcc17] px-4 py-3 text-sm font-black text-[#171717]">
                  Add to Cart
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
