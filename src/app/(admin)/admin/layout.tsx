import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Orders", href: "/admin/orders", icon: "📦" },
  { label: "Products", href: "/admin/products", icon: "🏷️" },
  { label: "Categories", href: "/admin/categories", icon: "📂" },
  { label: "Banners", href: "/admin/banners", icon: "🖼️" },
  { label: "Reviews", href: "/admin/reviews", icon: "⭐" },
  { label: "Payments", href: "/admin/payments", icon: "💳" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-[#0f172a] text-white transition-all duration-300 lg:static lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-[#0f172a]">
              TS
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Console</p>
              <h1 className="text-sm font-black text-white">Superstore</h1>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
              >
                <span className="text-lg opacity-70 group-hover:opacity-100">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-slate-800 p-6">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-[#0f172a] transition-all hover:bg-amber-400 active:scale-95"
            >
              🚀 Open Storefront
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header (Top Bar) */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Welcome back, Admin</h2>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-slate-200" />
              <button className="text-sm font-bold text-slate-600">Logout</button>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto outline-none">
          {children}
        </div>
      </div>
    </div>
  );
}



