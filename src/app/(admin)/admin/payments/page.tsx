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
    <main className="p-6 lg:p-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Financial Ledger</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Track real-time payment lifecycles and transaction history.</p>
          </div>
          <Link
            href="/api/admin/payments/reconciliation"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            Open Reconciliation API
          </Link>
        </div>

        {dbOffline && (
          <article className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-sm font-bold text-amber-800">Financial records are currently unavailable due to database maintenance.</p>
          </article>
        )}

        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Pending", value: statusSummary.CREATED ?? 0, color: "text-slate-400" },
            { label: "Authorized", value: statusSummary.AUTHORIZED ?? 0, color: "text-blue-500" },
            { label: "Success", value: statusSummary.CAPTURED ?? 0, color: "text-emerald-500" },
            { label: "Failed", value: statusSummary.FAILED ?? 0, color: "text-rose-500" },
            { label: "Refunds", value: (statusSummary.REFUNDED ?? 0) + (statusSummary.PARTIALLY_REFUNDED ?? 0), color: "text-amber-500" },
          ].map((item) => (
            <article key={item.label} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
              <p className={`mt-2 text-3xl font-black ${item.color}`}>{item.value}</p>
            </article>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Ref ID</th>
                  <th className="px-6 py-4">Processor</th>
                  <th className="px-6 py-4">Order Node</th>
                  <th className="px-6 py-4">Gross Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900">#{item.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{item.providerPaymentId}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
                        {item.provider}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">{item.order.orderNumber}</p>
                      <p className="text-[10px] font-bold text-slate-400">{item.order.status}</p>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900 text-base">
                      ₹{Number(item.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                        item.status === 'CAPTURED' ? 'bg-emerald-50 text-emerald-600' :
                        item.status === 'FAILED' ? 'bg-rose-50 text-rose-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-medium text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {transactions.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg font-bold text-slate-300">No transaction records found.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}