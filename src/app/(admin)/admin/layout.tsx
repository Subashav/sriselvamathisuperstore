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
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex w-full items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Admin Panel</p>
                <h1 className="text-lg font-bold text-yellow-500">Tamil Nadu Superstore</h1>
              </div>
            </div>

            <Link
              href="/"
              className="ml-auto inline-flex items-center rounded-lg bg-yellow-500 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-yellow-400 transition-colors"
            >
              Open Storefront
            </Link>
          </div>
        </div>

        <nav className="border-t border-gray-200 bg-gray-100">
          <div className="mx-auto max-w-full overflow-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-2">
              {navItems.map((item) => {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-yellow-300 hover:text-yellow-500"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {children}
    </div>
  );
}



