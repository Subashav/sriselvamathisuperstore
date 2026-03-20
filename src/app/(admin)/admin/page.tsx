import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let dbOffline = false;
  let products = 0;
  let orders = 0;
  let pendingOrders = 0;
  let customers = 0;
  let deliveredOrders = 0;
  let revenue: { _sum: { totalAmount: { toString(): string } | null } } = { _sum: { totalAmount: null } };
  let orderHealth: Array<{ status: string; _count: { _all: number } }> = [];
  let paymentHealth: Array<{ status: string; _count: { _all: number } }> = [];
  let reviewHealth: Array<{ status: string; _count: { _all: number } }> = [];
  let lowStock: Array<{ id: string; name: string; sku: string; stock: number; minStock: number }> = [];

  try {
    [products, orders, pendingOrders, customers, deliveredOrders, revenue, orderHealth, paymentHealth, reviewHealth, lowStock] =
      await Promise.all([
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
        prisma.order.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            status: {
              in: ["CONFIRMED", "SHIPPED", "DELIVERED"],
            },
          },
        }),
        prisma.order.groupBy({
          by: ["status"],
          _count: {
            _all: true,
          },
        }),
        prisma.paymentTransaction.groupBy({
          by: ["status"],
          _count: {
            _all: true,
          },
        }),
        prisma.review.groupBy({
          by: ["status"],
          _count: {
            _all: true,
          },
        }),
        prisma.product.findMany({
          where: {
            stock: {
              lte: prisma.product.fields.minStock,
            },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            minStock: true,
          },
          orderBy: {
            stock: "asc",
          },
          take: 5,
        }),
      ]);
  } catch {
    dbOffline = true;
  }

  const orderMap = Object.fromEntries(orderHealth.map((item) => [item.status, item._count._all]));
  const paymentMap = Object.fromEntries(paymentHealth.map((item) => [item.status, item._count._all]));
  const reviewMap = Object.fromEntries(reviewHealth.map((item) => [item.status, item._count._all]));

  const orderChart = [
    { label: "Pending", value: orderMap.PENDING ?? 0 },
    { label: "Confirmed", value: orderMap.CONFIRMED ?? 0 },
    { label: "Shipped", value: orderMap.SHIPPED ?? 0 },
    { label: "Delivered", value: orderMap.DELIVERED ?? 0 },
    { label: "Cancelled", value: orderMap.CANCELLED ?? 0 },
  ];

  const paymentChart = [
    { label: "Captured", value: paymentMap.CAPTURED ?? 0 },
    { label: "Authorized", value: paymentMap.AUTHORIZED ?? 0 },
    { label: "Created", value: paymentMap.CREATED ?? 0 },
    { label: "Failed", value: paymentMap.FAILED ?? 0 },
  ];

  const reviewChart = [
    { label: "Pending", value: reviewMap.PENDING ?? 0 },
    { label: "Approved", value: reviewMap.APPROVED ?? 0 },
    { label: "Rejected", value: reviewMap.REJECTED ?? 0 },
  ];

  const orderMax = Math.max(1, ...orderChart.map((item) => item.value));
  const paymentMax = Math.max(1, ...paymentChart.map((item) => item.value));
  const reviewMax = Math.max(1, ...reviewChart.map((item) => item.value));

  const cards = [
    { title: "Gross Revenue", value: `INR ${Number(revenue._sum.totalAmount ?? 0).toFixed(2)}`, note: "Captured + fulfilled orders" },
    { title: "Total Orders", value: String(orders), note: "All lifecycle states" },
    { title: "Pending Orders", value: String(pendingOrders), note: "Need confirmation or dispatch" },
    { title: "Delivered Orders", value: String(deliveredOrders), note: "Completed delivery cycle" },
    { title: "Products", value: String(products), note: "Across all categories" },
    { title: "Customers", value: String(customers), note: "Registered customers" },
  ];

  const quickActions = [
    { label: "Manage Orders", href: "/admin/orders" },
    { label: "Manage Products", href: "/admin/products" },
    { label: "Manage Categories", href: "/admin/categories" },
    { label: "Moderate Reviews", href: "/admin/reviews" },
    { label: "Payments and Reconciliation", href: "/admin/payments" },
  ];

  return (
    <main className="p-6 lg:p-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Real-time performance metrics and store health.</p>
        </div>

        {dbOffline ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-center gap-3 text-amber-800">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-bold">Database is currently offline. Showing cached or fallback data.</p>
            </div>
          </div>
        ) : null}

        {/* Stat Grid */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => {
            return (
              <article key={card.title} className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.title}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <p className="text-2xl font-black text-slate-900">{card.value.split(" ")[0]}</p>
                  <span className="text-xs font-bold text-amber-500">{card.value.split(" ").slice(1).join(" ")}</span>
                </div>
                <p className="mt-2 text-[10px] font-medium text-slate-400">{card.note}</p>
              </article>
            );
          })}
        </div>

        <div className="mb-10 grid gap-8 lg:grid-cols-2">
          {/* Quick Actions */}
          <article className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Quick Operations</h3>
            </div>
            <div className="p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700 transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 active:scale-[0.98]"
                  >
                    {action.label}
                    <span className="text-amber-400">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </article>

          {/* Platform Health */}
          <article className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Platform Health</h3>
            </div>
            <div className="p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Payments Captured", value: paymentMap.CAPTURED ?? 0, color: "text-emerald-600" },
                  { label: "Payments Failed", value: paymentMap.FAILED ?? 0, color: "text-rose-600" },
                  { label: "Pending Reviews", value: reviewMap.PENDING ?? 0, color: "text-amber-600" },
                  { label: "Approved Reviews", value: reviewMap.APPROVED ?? 0, color: "text-blue-600" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className={`mt-2 text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>

        {/* Low Stock Alert */}
        <article className="mb-10 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-5">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 text-rose-600">Low Stock Inventory</h3>
            <Link href="/admin/products" className="text-xs font-bold text-amber-600 hover:underline">
              Manage Inventory →
            </Link>
          </div>

          <div className="p-8">
            {lowStock.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lowStock.map((item) => (
                  <div key={item.id} className="group relative rounded-2xl border border-rose-100 bg-rose-50/30 p-5 transition-all hover:bg-rose-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">{item.name}</p>
                        <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKU: {item.sku}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-rose-600">{item.stock}</span>
                        <span className="text-[10px] font-bold text-rose-400 uppercase">Min: {item.minStock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-100 py-10 text-center">
                <p className="text-sm font-bold text-slate-400">Inventory is healthy. No low stock alerts.</p>
              </div>
            )}
          </div>
        </article>

        {/* Interactive Analytics */}
        <div className="grid gap-8 lg:grid-cols-3">
          {[
            { title: "Order Lifecycle", chart: orderChart, max: orderMax, color: "bg-amber-500" },
            { title: "Payment Pipeline", chart: paymentChart, max: paymentMax, color: "bg-slate-900" },
            { title: "Review Moderation", chart: reviewChart, max: reviewMax, color: "bg-blue-600" },
          ].map((block) => (
            <article key={block.title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{block.title}</h3>
              <div className="mt-8 space-y-5">
                {block.chart.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>{item.label}</span>
                      <span className="text-slate-900">{item.value}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-50">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${block.color}`}
                        style={{ width: `${Math.max(4, (item.value / block.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}



