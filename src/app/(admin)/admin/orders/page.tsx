import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let dbOffline = false;
  let orders: Array<{
    id: string;
    orderNumber: string;
    user?: { fullName: string | null; email: string | null; mobile: string | null } | null;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    totalAmount: { toString(): string };
    placedAt: Date;
    items: Array<unknown>;
  }> = [];

  try {
    orders = await prisma.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            fullName: true,
            email: true,
            mobile: true,
          },
        },
      },
      orderBy: {
        placedAt: "desc",
      },
      take: 40,
    });
  } catch {
    dbOffline = true;
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#113d78]">Order Management</h2>
            <p className="mt-2 text-sm text-[#58779a]">
              Review recent orders and update status via PATCH /api/orders/[id]/status in your admin workflow.
            </p>
          </div>
          <Link
            href="/api/admin/orders/export"
            className="rounded-lg bg-[#111827] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#1f2937]"
          >
            Download Orders CSV
          </Link>
        </div>
        {dbOffline ? (
          <p className="mt-3 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-2 text-sm font-semibold text-[#9a5a17]">
            Database is offline. Orders cannot be loaded right now.
          </p>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e1ecfb] text-xs uppercase tracking-[0.1em] text-[#5e7899]">
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[#eef4ff] align-top">
                  <td className="px-3 py-3">
                    <p className="font-bold text-[#1f4f8b]">{order.orderNumber}</p>
                    <p className="text-xs text-[#6781a2]">{order.id}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#234f88]">{order.user?.fullName ?? "Guest"}</p>
                    <p className="text-xs text-[#6781a2]">{order.user?.email ?? order.user?.mobile ?? "N/A"}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-[#e9f3ff] px-2 py-1 text-xs font-bold text-[#1d5ba5]">{order.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#234f88]">{order.paymentStatus}</p>
                    <p className="text-xs text-[#6781a2]">{order.paymentMethod ?? "N/A"}</p>
                  </td>
                  <td className="px-3 py-3 text-[#234f88]">{order.items.length}</td>
                  <td className="px-3 py-3 font-black text-[#0f4ea5]">INR {order.totalAmount.toString()}</td>
                  <td className="px-3 py-3 text-xs text-[#6781a2]">{new Date(order.placedAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}