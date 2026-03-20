import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Banners", href: "/admin/banners" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Payments", href: "/admin/payments" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#efefeb_0%,#f8f8f7_42%,#ffffff_100%)] text-[#1a1a1a]">
      <header className="sticky top-0 z-30 border-b border-[#e6e6e2] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6c6c66]">Tamil Nadu Superstore</p>
            <h1 className="text-lg font-black text-[#161616]">Admin Panel</h1>
          </div>
          <Link href="/" className="rounded-lg border border-[#d9d9d3] px-3 py-1.5 text-xs font-bold text-[#1b1b1b] transition hover:bg-[#f4f4f1]">
            Open Storefront
          </Link>
        </div>

        <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-auto px-4 pb-3 sm:px-6 lg:px-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-[#dfdfd8] bg-white px-4 py-1.5 text-xs font-bold text-[#3d3d38] transition hover:border-[#1e1e1e] hover:text-[#1e1e1e]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </div>
  );
}
