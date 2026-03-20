import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  let dbOffline = false;
  let pending: Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    user: { fullName: string | null; email: string | null };
    product: { id: string; name: string };
  }> = [];
  let approved = 0;
  let rejected = 0;

  try {
    [pending, approved, rejected] = await Promise.all([
      prisma.review.findMany({
        where: { status: "PENDING" },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.review.count({ where: { status: "APPROVED" } }),
      prisma.review.count({ where: { status: "REJECTED" } }),
    ]);
  } catch {
    dbOffline = true;
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl rounded-2xl border border-[#d3e3f8] bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-[#113d78]">Review Moderation</h2>
        <p className="mt-2 text-sm text-[#58779a]">Approve or reject user reviews to control storefront quality signals.</p>
        {dbOffline ? (
          <p className="mt-3 rounded-xl border border-[#f2d4b5] bg-[#fff4e8] px-4 py-2 text-sm font-semibold text-[#9a5a17]">
            Database is offline. Moderation queue cannot be loaded right now.
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl bg-[#edf5ff] p-4">
            <p className="text-xs font-bold uppercase text-[#55759b]">Pending</p>
            <p className="mt-2 text-2xl font-black text-[#0f4ea5]">{pending.length}</p>
          </article>
          <article className="rounded-xl bg-[#edf5ff] p-4">
            <p className="text-xs font-bold uppercase text-[#55759b]">Approved</p>
            <p className="mt-2 text-2xl font-black text-[#0f4ea5]">{approved}</p>
          </article>
          <article className="rounded-xl bg-[#edf5ff] p-4">
            <p className="text-xs font-bold uppercase text-[#55759b]">Rejected</p>
            <p className="mt-2 text-2xl font-black text-[#0f4ea5]">{rejected}</p>
          </article>
        </div>

        <div className="mt-6 space-y-3">
          {pending.length ? (
            pending.map((review) => (
              <article key={review.id} className="rounded-xl border border-[#deebfb] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1f4f8b]">{review.product.name}</p>
                    <p className="text-xs text-[#6781a2]">By {review.user.fullName ?? review.user.email ?? "Anonymous"}</p>
                  </div>
                  <p className="rounded-full bg-[#e9f3ff] px-2 py-1 text-xs font-bold text-[#1d5ba5]">{review.rating}/5</p>
                </div>

                {review.title ? <p className="mt-2 text-sm font-semibold text-[#224f87]">{review.title}</p> : null}
                {review.comment ? <p className="mt-1 text-sm text-[#4f7095]">{review.comment}</p> : null}

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <Link
                    href={`/api/admin/reviews/${review.id}/moderate`}
                    className="rounded-lg border border-[#d2e3f8] px-3 py-1.5 text-[#1e4f8d]"
                  >
                    Moderate Endpoint
                  </Link>
                  <span className="rounded-lg bg-[#fff4e8] px-3 py-1.5 text-[#9a5a17]">
                    PATCH body: status APPROVED or status REJECTED
                  </span>
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-xl bg-[#f6faff] p-4 text-sm text-[#56789c]">No pending reviews for moderation.</article>
          )}
        </div>
      </section>
    </main>
  );
}