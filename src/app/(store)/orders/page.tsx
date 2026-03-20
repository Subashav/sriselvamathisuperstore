import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  let dbOffline = false;
  let orders: Array<{
    id: string;
    orderNumber: string;
    placedAt: Date;
    status: string;
    totalAmount: { toString(): string };
    items: Array<unknown>;
  }> = [];

  try {
    orders = await prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 30,
      include: {
        items: true,
      },
    });
  } catch {
    dbOffline = true;
  }

  return (
    <main className="uni-shell min-h-screen">
      <div className="uni-glow uni-glow-left" aria-hidden="true" />
      <div className="uni-glow uni-glow-right" aria-hidden="true" />

      <section className="bg-black px-4 py-2 text-[11px] text-white sm:px-7 sm:text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Live order tracking</p>
          <p className="hidden text-center font-medium md:block">From Pending to Delivered</p>
          <p className="font-semibold">Need help? +91 98948-49778</p>
        </div>
      </section>

      <section className="bg-white px-4 pb-8 pt-5 sm:px-7">
        <div className="mx-auto max-w-[1180px]">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-[#1a1a1a]">Order History</h1>
              <p className="mt-1 text-sm text-[#6f6f6f]">Review your latest purchases and order status.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/products" className="rounded-xl border border-[#dfdfdf] px-4 py-2 text-sm font-semibold text-[#373737]">
                Shop More
              </Link>
              <Link href="/checkout" className="rounded-xl bg-[#f97316] px-4 py-2 text-sm font-black text-[#1d1d1d]">
                Checkout
              </Link>
            </div>
          </header>

          {dbOffline ? (
            <article className="mb-4 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-3 text-sm font-semibold text-[#9a5a17]">
              Database is currently offline. Order history will appear when PostgreSQL is available.
            </article>
          ) : null}

          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-[#ececec] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-[#1e1e1e]">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-[#777]">Placed {order.placedAt.toLocaleString("en-IN")}</p>
                  </div>
                  <p className="rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-bold text-[#4f4f4f]">{order.status}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f0f0] pt-3">
                  <p className="text-xs text-[#666]">Items: {order.items.length}</p>
                  <p className="text-sm font-black text-[#ef4f4f]">INR {order.totalAmount.toString()}</p>
                </div>
              </article>
            ))}

            {orders.length === 0 ? (
              <article className="rounded-2xl border border-dashed border-[#d8d8d8] bg-white p-5 text-sm text-[#666]">
                No orders yet. Place your first order from checkout.
              </article>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

