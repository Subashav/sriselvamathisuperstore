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
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-500">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Monitor your store's performance and analytics</p>
        </div>

        {dbOffline ? (
          <div className="mb-6 rounded-lg border-l-4 border-orange-500 bg-white p-4">
            <p className="text-sm font-semibold text-orange-600">Database offline - Panel in fallback mode</p>
          </div>
        ) : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => {
            return (
              <article key={card.title} className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold uppercase text-gray-600 tracking-wider">{card.title}</p>
                <div className="mt-3 flex items-end gap-2">
                  <p className="text-2xl font-bold text-yellow-500">{card.value.split(" ")[0]}</p>
                  <span className="text-sm text-gray-500">{card.value.split(" ").slice(1).join(" ")}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">{card.note}</p>
              </article>
            );
          })}
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid gap-2 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition-colors hover:border-yellow-300 hover:text-yellow-500"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-bold text-slate-900">Platform Health</h3>
            </div>
            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payments Captured</p>
                  <p className="mt-2 text-2xl font-bold text-yellow-500">{paymentMap.CAPTURED ?? 0}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payments Failed</p>
                  <p className="mt-2 text-2xl font-bold text-gray-700">{paymentMap.FAILED ?? 0}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pending Reviews</p>
                  <p className="mt-2 text-2xl font-bold text-yellow-500">{reviewMap.PENDING ?? 0}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Approved Reviews</p>
                  <p className="mt-2 text-2xl font-bold text-yellow-500">{reviewMap.APPROVED ?? 0}</p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <article className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-base font-bold text-slate-900">Low Stock Alert</h3>
            <Link href="/admin/products" className="text-xs font-semibold text-yellow-500 transition-colors hover:text-yellow-500">
              View All
            </Link>
          </div>

          <div className="p-6">
            {lowStock.length ? (
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                      </div>
                      <div className="rounded bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-500">
                        {item.stock} / {item.minStock}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-sm font-semibold text-slate-700">All products are above minimum stock</p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-base font-bold text-slate-900">Admin APIs</h3>
          </div>
          <div className="p-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/api/products?mode=admin" className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition-colors hover:border-yellow-300 hover:text-yellow-500">
                Products API
              </Link>
              <Link href="/api/orders?mode=admin" className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition-colors hover:border-yellow-300 hover:text-yellow-500">
                Orders API
              </Link>
              <Link href="/api/admin/payments/reconciliation" className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition-colors hover:border-yellow-300 hover:text-yellow-500">
                Reconciliation API
              </Link>
              <Link href="/api/admin/overview" className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition-colors hover:border-yellow-300 hover:text-yellow-500">
                Overview API
              </Link>
            </div>
          </div>
        </article>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Orders Graph</h3>
            <p className="mt-1 text-xs text-gray-500">Order lifecycle distribution</p>
            <div className="mt-4 space-y-3">
              {orderChart.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 rounded bg-gray-100">
                    <div
                      className="h-2 rounded bg-yellow-500"
                      style={{ width: `${Math.max(6, (item.value / orderMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Payments Graph</h3>
            <p className="mt-1 text-xs text-gray-500">Payment status overview</p>
            <div className="mt-4 space-y-3">
              {paymentChart.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 rounded bg-gray-100">
                    <div
                      className="h-2 rounded bg-slate-900"
                      style={{ width: `${Math.max(6, (item.value / paymentMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Reviews Graph</h3>
            <p className="mt-1 text-xs text-gray-500">Moderation queue and outcomes</p>
            <div className="mt-4 space-y-3">
              {reviewChart.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-2 rounded bg-gray-100">
                    <div
                      className="h-2 rounded bg-yellow-500"
                      style={{ width: `${Math.max(6, (item.value / reviewMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}



