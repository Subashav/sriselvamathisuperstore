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
  let paymentHealth: Array<{ status: string; _count: { _all: number } }> = [];
  let reviewHealth: Array<{ status: string; _count: { _all: number } }> = [];
  let lowStock: Array<{ id: string; name: string; sku: string; stock: number; minStock: number }> = [];

  try {
    [products, orders, pendingOrders, customers, deliveredOrders, revenue, paymentHealth, reviewHealth, lowStock] =
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

  const paymentMap = Object.fromEntries(paymentHealth.map((item) => [item.status, item._count._all]));
  const reviewMap = Object.fromEntries(reviewHealth.map((item) => [item.status, item._count._all]));

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
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-black text-[#113d78]">Operations Dashboard</h2>
        <p className="mt-2 text-sm text-[#56779c]">
          Monitor commerce performance, stock health, payments, and review moderation from one control center.
        </p>
        {dbOffline ? (
          <p className="mt-3 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-2 text-sm font-semibold text-[#9a5a17]">
            Database is currently offline. Panel is in fallback mode until PostgreSQL is available.
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#275792]">{card.title}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{card.value}</p>
              <p className="mt-2 text-xs text-slate-500">{card.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#275792]">Quick Actions</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-xl border border-[#d2e3f8] px-4 py-3 text-sm font-semibold text-[#1e4f8d] transition hover:bg-[#f4f8ff]"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#275792]">Platform Health</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#edf4ff] p-3">
                <p className="text-xs font-semibold uppercase text-[#355f92]">Payments Captured</p>
                <p className="mt-1 text-2xl font-black text-[#0f4ea5]">{paymentMap.CAPTURED ?? 0}</p>
              </div>
              <div className="rounded-xl bg-[#edf4ff] p-3">
                <p className="text-xs font-semibold uppercase text-[#355f92]">Payments Failed</p>
                <p className="mt-1 text-2xl font-black text-[#0f4ea5]">{paymentMap.FAILED ?? 0}</p>
              </div>
              <div className="rounded-xl bg-[#edf4ff] p-3">
                <p className="text-xs font-semibold uppercase text-[#355f92]">Pending Reviews</p>
                <p className="mt-1 text-2xl font-black text-[#0f4ea5]">{reviewMap.PENDING ?? 0}</p>
              </div>
              <div className="rounded-xl bg-[#edf4ff] p-3">
                <p className="text-xs font-semibold uppercase text-[#355f92]">Approved Reviews</p>
                <p className="mt-1 text-2xl font-black text-[#0f4ea5]">{reviewMap.APPROVED ?? 0}</p>
              </div>
            </div>
          </article>
        </div>

        <article className="mt-6 rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#275792]">Low Stock Alert</p>
            <Link href="/admin/products" className="text-xs font-bold text-[#1768d6]">
              Open Products
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {lowStock.length ? (
              lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#deebfb] p-3 text-sm">
                  <div>
                    <p className="font-bold text-[#1d4f8f]">{item.name}</p>
                    <p className="text-xs text-[#60799a]">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#60799a]">Stock / Min</p>
                    <p className="font-black text-[#c65c00]">
                      {item.stock} / {item.minStock}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-[#f6faff] p-3 text-sm text-[#58779b]">All products are above minimum stock threshold.</p>
            )}
          </div>
        </article>

        <article className="mt-6 rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#275792]">Admin APIs</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/api/products?mode=admin"
              className="rounded-xl border border-[#d2e3f8] px-4 py-3 text-sm font-semibold text-[#1e4f8d] transition hover:bg-[#f4f8ff]"
            >
              Products API
            </Link>
            <Link
              href="/api/orders?mode=admin"
              className="rounded-xl border border-[#d2e3f8] px-4 py-3 text-sm font-semibold text-[#1e4f8d] transition hover:bg-[#f4f8ff]"
            >
              Orders API
            </Link>
            <Link
              href="/api/admin/payments/reconciliation"
              className="rounded-xl border border-[#d2e3f8] px-4 py-3 text-sm font-semibold text-[#1e4f8d] transition hover:bg-[#f4f8ff]"
            >
              Reconciliation API
            </Link>
            <Link
              href="/api/admin/overview"
              className="rounded-xl border border-[#d2e3f8] px-4 py-3 text-sm font-semibold text-[#1e4f8d] transition hover:bg-[#f4f8ff]"
            >
              Overview API
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
