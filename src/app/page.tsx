import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import OfferStripTicker from "@/components/offer-strip-ticker";
import CustomerAuthNav from "@/components/customer-auth-nav";
import HeroRotatingBanner from "@/components/hero-rotating-banner";

export const dynamic = "force-dynamic";

export default async function Home() {
  let dbOffline = false;
  let categories: Array<{
    name: string;
    slug: string;
    description: string | null;
    imageUrl?: string | null;
    subcategories: Array<{ id: string; name: string; slug: string; isActive: boolean }>;
  }> = [];
  let banners: Array<{ id: string; title: string; description?: string; imageUrl: string; bgColor: string; textColor: string; link?: string }> = [];
  let stripOffers: Array<{ id: string; title: string; description?: string; link?: string }> = [];
  let bestSellers: Array<{ name: string; price: string; old: string; rating: string; imageUrl?: string }> = [];

  try {
    const [categoriesData, bannersData, bestSellerData] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
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
        select: { id: true, type: true, title: true, description: true, imageUrl: true, bgColor: true, textColor: true, link: true },
      }),
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          images: {
            some: {},
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ],
        take: 5,
        select: {
          name: true,
          price: true,
          mrp: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { imageUrl: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),
    ]);
    categories = categoriesData;
    const imageBanners = bannersData.filter((banner) => banner.type === 'IMAGE' && Boolean(banner.imageUrl));
    const textBanners = bannersData.filter((banner) => banner.type === 'TEXT');

    banners = imageBanners.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description || undefined,
      imageUrl: b.imageUrl || '',
      bgColor: b.bgColor,
      textColor: b.textColor,
      link: b.link || undefined,
    }));

    stripOffers = (textBanners.length ? textBanners : bannersData).map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description || undefined,
      link: b.link || undefined,
    }));

    if (bestSellerData.length) {
      bestSellers = bestSellerData.map((product) => {
        const rating = product.reviews.length
          ? (product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
          : "4.5";

        return {
          name: product.name,
          price: `INR ${Number(product.price).toLocaleString("en-IN")}`,
          old: `INR ${Number(product.mrp).toLocaleString("en-IN")}`,
          rating,
          imageUrl: product.images[0]?.imageUrl,
        };
      });
    }
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

  const categoryImageBySlug: Record<string, string> = {
    groceries: "/uploads/products/sample-rice-1.svg",
    toys: "/uploads/products/sample-toycar-1.svg",
    "kitchen-utensils": "/uploads/products/sample-frypan-1.svg",
    stationery: "/uploads/products/sample-notebook-1.svg",
    "home-decor": "/uploads/products/sample-wallart-1.svg",
  };

  const categoryTiles = categories.length
    ? categories.slice(0, 6).map((category, index) => ({
        name: category.name,
        slug: category.slug,
        tone: tones[index % tones.length],
        imageUrl: category.imageUrl || categoryImageBySlug[category.slug] || categoryImageBySlug["groceries"],
      }))
    : [
        { name: "Groceries", slug: "", tone: tones[0], imageUrl: "/uploads/products/sample-rice-1.svg" },
        { name: "Toys", slug: "", tone: tones[1], imageUrl: "/uploads/products/sample-toycar-1.svg" },
        { name: "Kitchen", slug: "", tone: tones[2], imageUrl: "/uploads/products/sample-frypan-1.svg" },
        { name: "Stationery", slug: "", tone: tones[3], imageUrl: "/uploads/products/sample-notebook-1.svg" },
        { name: "Decor", slug: "", tone: tones[4], imageUrl: "/uploads/products/sample-wallart-1.svg" },
        { name: "More", slug: "", tone: tones[5], imageUrl: "/uploads/products/sample-rice-2.svg" },
      ];

  const subCategorySuggestions = categories.flatMap((category) => category.subcategories).slice(0, 6);

  const renderCategoryIcon = (label: string) => {
    const key = label.toLowerCase();

    if (key.includes("fashion")) {
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 5l4-2 4 2 3 4-3 2v9H8v-9L5 9l3-4z" />
        </svg>
      );
    }

    if (key.includes("mobile") || key.includes("phone")) {
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2.5" width="10" height="19" rx="2" />
          <path d="M10 18h4" />
        </svg>
      );
    }

    if (key.includes("book")) {
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 0 5 22z" />
          <path d="M5 4.5V22" />
        </svg>
      );
    }

    if (key.includes("home") || key.includes("decor")) {
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11.5L12 4l9 7.5" />
          <path d="M6 10.5V20h12v-9.5" />
        </svg>
      );
    }

    if (key.includes("toy") || key.includes("sport")) {
      return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="15" r="3" />
          <circle cx="16" cy="9" r="3" />
          <path d="M10.5 13.5l3-3" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  };

  return (
    <div className="uni-shell min-h-screen">
      <div className="uni-glow uni-glow-left" aria-hidden="true" />
      <div className="uni-glow uni-glow-right" aria-hidden="true" />

      <main className="relative min-h-screen w-full bg-[#f6f6f6]">
        <div className="fixed inset-x-0 top-0 z-50">
          <section className="bg-black px-4 py-2 text-[11px] text-white sm:px-7 sm:text-xs">
            <div className="flex items-center justify-between gap-3">
              <p className="hidden font-semibold sm:block">Live Offers</p>
              <div className="min-w-0 flex-1">
                <OfferStripTicker offers={stripOffers} autoScrollInterval={5000} />
              </div>
            </div>
          </section>

          <div className="bg-white px-4 pt-4 sm:px-7">
            <header className="border-b border-[#efefef] bg-white/95 pb-4 backdrop-blur supports-[backdrop-filter]:bg-white/85">
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
                <div className="ml-auto hidden items-center gap-6 sm:flex">
                  <Link href="/products" className="text-sm font-semibold text-[#474747] transition-colors hover:text-[#111]">
                    Shop
                  </Link>
                  <Link href="/orders" className="text-sm font-semibold text-[#474747] transition-colors hover:text-[#111]">
                    Orders
                  </Link>
                  <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#474747] transition-colors hover:text-[#111]">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 text-[#2f2f2f]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="20" r="1.6" />
                      <circle cx="18" cy="20" r="1.6" />
                      <path d="M2.5 3.5h2.2l1.8 10h12.4l2-7.3H6" />
                    </svg>
                    Cart
                  </Link>
                  <CustomerAuthNav />
                </div>
              </div>
              <div className="mt-3 sm:hidden">
                <CustomerAuthNav />
              </div>
              <nav className="mt-3 overflow-x-auto border-y border-[#ededed] bg-white pb-0.5">
                <div className="flex min-w-max items-stretch gap-1 px-1 sm:gap-2 sm:px-2">
                  {navPills.map((item, index) => (
                    <Link
                      key={item.label}
                      href={item.slug ? `/products?categorySlug=${item.slug}` : "/products"}
                      className={`flex min-w-[84px] flex-col items-center justify-center gap-1 px-2 py-2 text-center text-[11px] font-semibold transition-colors sm:min-w-[96px] ${
                        index === 0 ? "border-b-2 border-[#1877f2] text-[#0f172a]" : "border-b-2 border-transparent text-[#1f2937] hover:text-[#0f172a]"
                      }`}
                    >
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${index === 0 ? "bg-[#e6f2ff]" : "bg-[#f8f8f8]"}`}>
                        {renderCategoryIcon(item.label)}
                      </span>
                      <span className="max-w-[84px] truncate">{item.label}</span>
                    </Link>
                  ))}
                  <Link
                    href="/products?sort=popular"
                    className="flex min-w-[84px] flex-col items-center justify-center gap-1 border-b-2 border-transparent px-2 py-2 text-center text-[11px] font-semibold text-[#1f2937] transition-colors hover:text-[#0f172a] sm:min-w-[96px]"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffedd5] text-[#c2410c]">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.2l5.9-.9z" />
                      </svg>
                    </span>
                    <span className="max-w-[84px] truncate">Offers</span>
                  </Link>
                </div>
              </nav>
            </header>
          </div>
        </div>

        <div className="h-[170px] sm:h-[185px]" aria-hidden="true" />

        <section className="bg-white px-4 pb-6 pt-4 sm:px-7 sm:pb-8">
          {dbOffline ? (
            <article className="mb-4 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-3 text-sm font-semibold text-[#9a5a17]">
              Database is currently offline. Category data from admin panel will appear once PostgreSQL is available.
            </article>
          ) : null}

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
            <section>
              <HeroRotatingBanner autoScrollInterval={4200} />

              <section className="mt-4 rounded-2xl border border-[#ece6df] bg-[linear-gradient(145deg,#ffffff_0%,#fff7ef_100%)] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.06)] sm:p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["300,000", "happy customers"],
                    ["150,000", "products"],
                    ["Excellent", "service"],
                  ].map((stat, index) => (
                    <article
                      key={stat[1]}
                      className="group relative overflow-hidden rounded-xl border border-[#f1e3d3] bg-white px-4 py-4 shadow-[0_6px_16px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_20px_rgba(0,0,0,0.08)]"
                    >
                      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#f97316]/12" aria-hidden="true" />
                      <div className="relative">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1e7] text-[#c2410c]">
                          {index === 0 ? (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 19.5V18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1.5" />
                              <circle cx="12" cy="8" r="3" />
                            </svg>
                          ) : index === 1 ? (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3.5" y="5" width="17" height="14" rx="2" />
                              <path d="M7.5 9h9M7.5 13h6" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M12 21s-6.5-4.4-6.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 6.5 4c0 5.6-6.5 10-6.5 10z" />
                            </svg>
                          )}
                        </span>
                        <p className="mt-3 text-2xl font-black tracking-tight text-[#171717]">{stat[0]}</p>
                        <p className="text-sm font-semibold text-[#666]">{stat[1]}</p>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-[#f4ede6]">
                          <div className={`h-1.5 rounded-full bg-[#f97316] ${index === 0 ? "w-[85%]" : index === 1 ? "w-[72%]" : "w-[94%]"}`} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
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
                      <div className={`mx-auto h-16 w-16 overflow-hidden rounded-full bg-gradient-to-b ${item.tone} ring-1 ring-[#ebebeb]`}>
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : null}
                      </div>
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
                {bestSellers.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {bestSellers.map((product, index) => (
                      <Link
                        key={product.name}
                        href="/products"
                        className="rounded-2xl border border-[#ececec] bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
                      >
                        <span className="inline-flex rounded-md bg-[#ff4e4e] px-2 py-1 text-[10px] font-black text-white">Offer</span>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="mt-2 h-24 w-full rounded-xl object-cover" />
                        ) : (
                          <div className="mt-2 h-24 rounded-xl bg-[linear-gradient(135deg,#f5f5f5_0%,#ececec_100%)]" />
                        )}
                        <h3 className="mt-3 text-xs font-bold leading-snug text-[#202020]">{product.name}</h3>
                        <p className="mt-2 text-base font-black text-[#f04747]">{product.price}</p>
                        <p className="text-[11px] text-[#949494] line-through">{product.old}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[#767676]">Rating {product.rating}</p>
                        <span className="sr-only">Open product {index + 1}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#ececec] bg-white p-6 text-center text-sm font-semibold text-[#666]">
                    No active products with images available yet.
                  </div>
                )}
              </section>

              <section className="mt-6 overflow-hidden rounded-2xl border border-[#fb923c] bg-[linear-gradient(118deg,#1b1b1b_0%,#2a2a2a_22%,#f97316_23%,#fdba74_58%,#ffedd5_100%)] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[620px]">
                    <p className="inline-flex rounded-full border border-white/70 bg-white/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-white">TODAY'S OFFERS</p>
                    <p className="mt-2 text-3xl font-black text-white sm:text-4xl">Premium Sale Banner</p>
                    <p className="mt-1 text-sm font-semibold text-white/85">Limited-time savings across daily essentials, toys, decor, and kitchen picks.</p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {[
                        "Buy 2 Get 1 Free",
                        "Extra 15% on INR 1999+",
                        "Free Delivery over INR 499",
                      ].map((offer) => (
                        <div key={offer} className="rounded-lg border border-[#fdba74] bg-white/80 px-3 py-2 text-xs font-bold text-[#202020] backdrop-blur-sm">
                          {offer}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <p className="text-xl font-black text-[#d23636] sm:text-2xl">Up to 60% OFF</p>
                      <p className="text-sm font-semibold text-[#fed7aa] line-through">INR 4,999</p>
                    </div>

                    <Link href="/products?sort=popular" className="mt-4 inline-flex rounded-xl bg-[#111] px-5 py-2 text-sm font-black text-white">
                      Shop Today's Deals
                    </Link>
                  </div>

                  <div className="flex gap-2">
                    {[
                      ["10", "Hours"],
                      ["33", "Minutes"],
                      ["39", "Seconds"],
                    ].map((slot) => (
                      <div key={slot[1]} className="min-w-20 rounded-xl border border-[#fb923c] bg-white/90 px-3 py-2 text-center shadow-[0_6px_12px_rgba(0,0,0,0.1)]">
                        <p className="text-xl font-black text-[#171717]">{slot[0]}</p>
                        <p className="text-[11px] font-semibold text-[#6b6b6b]">{slot[1]}</p>
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
                {bestSellers.length > 0 ? (
                  <>
                    <p className="text-[10px] font-bold uppercase text-[#a6a6a6]">Featured Deal</p>
                    <h3 className="mt-1 line-clamp-2 min-h-16 text-2xl font-black leading-tight text-[#191919]">{bestSellers[0].name}</h3>
                    <span className="mt-3 inline-flex rounded-md bg-[#ff4f4f] px-2 py-1 text-[10px] font-black text-white">Offer</span>
                    <div className="mt-3 h-60 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#ececec_76%)]">
                      {bestSellers[0].imageUrl ? (
                        <img src={bestSellers[0].imageUrl} alt="Featured product" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gray-200" />
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black text-[#ef4f4f]">{bestSellers[0].price}</p>
                        <p className="text-xs text-[#909090] line-through">{bestSellers[0].old}</p>
                        <p className="mt-1 text-xs font-bold text-[#3a9d6d]">In stock</p>
                      </div>
                      <p className="text-xs font-semibold text-[#787878]">{bestSellers[0].rating} (23)</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-bold uppercase text-[#a6a6a6]">XIAOMI</p>
                    <h3 className="mt-1 text-2xl font-black leading-tight text-[#191919]">Wireless Earbuds Redmi Buds 4 Lite</h3>
                    <span className="mt-3 inline-flex rounded-md bg-[#ff4f4f] px-2 py-1 text-[10px] font-black text-white">Offer</span>
                    <div className="mt-3 h-60 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_20%,#ffffff_0%,#ececec_76%)]">
                      <div className="h-full w-full bg-gray-200" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-black text-[#ef4f4f]">INR 1,299</p>
                        <p className="text-xs text-[#909090] line-through">INR 1,999</p>
                        <p className="mt-1 text-xs font-bold text-[#3a9d6d]">In stock</p>
                      </div>
                    </div>
                  </>
                )}
                <Link href="/cart" className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#f97316] px-4 py-3 text-sm font-black text-[#171717]">
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

