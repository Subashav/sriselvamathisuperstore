import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  let dbOffline = false;
  let transactions: Array<{
    id: string;
    providerPaymentId: string | null;
    provider: string;
    amount: { toString(): string };
    status: string;
    method: string | null;
    createdAt: Date;
    order: { orderNumber: string; status: string };
  }> = [];
  let grouped: Array<{ status: string; _count: { _all: number } }> = [];

  try {
    [transactions, grouped] = await Promise.all([
      prisma.paymentTransaction.findMany({
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              status: true,
              paymentStatus: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 80,
      }),
      prisma.paymentTransaction.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);
  } catch {
    dbOffline = true;
  }

  const statusSummary = Object.fromEntries(grouped.map((item) => [item.status, item._count._all]));

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#113d78]">Payments and Reconciliation</h2>
            <p className="mt-2 text-sm text-[#58779a]">Track payment lifecycle by provider and match records against orders.</p>
          </div>

          <Link
            href="/api/admin/payments/reconciliation"
            className="rounded-lg border border-[#bfd2ef] px-3 py-2 text-xs font-bold text-[#0f4ea5] transition hover:bg-[#eef5ff]"
          >
            Open Reconciliation API
          </Link>
        </div>
        {dbOffline ? (
          <p className="mt-3 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-2 text-sm font-semibold text-[#9a5a17]">
            Database is offline. Payment data cannot be loaded right now.
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Created", value: statusSummary.CREATED ?? 0 },
            { label: "Authorized", value: statusSummary.AUTHORIZED ?? 0 },
            { label: "Captured", value: statusSummary.CAPTURED ?? 0 },
            { label: "Failed", value: statusSummary.FAILED ?? 0 },
            { label: "Refunded", value: (statusSummary.REFUNDED ?? 0) + (statusSummary.PARTIALLY_REFUNDED ?? 0) },
          ].map((item) => (
            <article key={item.label} className="rounded-xl bg-[#edf5ff] p-4">
              <p className="text-xs font-bold uppercase text-[#55759b]">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-[#0f4ea5]">{item.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e1ecfb] text-xs uppercase tracking-[0.1em] text-[#5e7899]">
                <th className="px-3 py-2">Transaction</th>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="border-b border-[#eef4ff] align-top">
                  <td className="px-3 py-3">
                    <p className="font-bold text-[#1f4f8b]">{item.id.slice(0, 12)}</p>
                    <p className="text-xs text-[#6781a2]">{item.providerPaymentId ?? "No payment id yet"}</p>
                  </td>
                  <td className="px-3 py-3 text-[#234f88]">{item.provider}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#234f88]">{item.order.orderNumber}</p>
                    <p className="text-xs text-[#6781a2]">{item.order.status}</p>
                  </td>
                  <td className="px-3 py-3 font-black text-[#0f4ea5]">INR {item.amount.toString()}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-[#e9f3ff] px-2 py-1 text-xs font-bold text-[#1d5ba5]">{item.status}</span>
                  </td>
                  <td className="px-3 py-3 text-[#234f88]">{item.method ?? "N/A"}</td>
                  <td className="px-3 py-3 text-xs text-[#6781a2]">{new Date(item.createdAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}