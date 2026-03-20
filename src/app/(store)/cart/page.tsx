import Link from "next/link";

export default function CartPage() {
  return (
    <main className="uni-shell min-h-screen">
      <div className="uni-glow uni-glow-left" aria-hidden="true" />
      <div className="uni-glow uni-glow-right" aria-hidden="true" />

      <section className="bg-black px-4 py-2 text-[11px] text-white sm:px-7 sm:text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Service 4.9 out of 5</p>
          <p className="hidden text-center font-medium md:block">Express shipping available</p>
          <p className="font-semibold">Secure checkout</p>
        </div>
      </section>

      <section className="bg-white px-4 pb-8 pt-5 sm:px-7">
        <div className="mx-auto max-w-[1180px]">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-[#1a1a1a]">Your Cart</h1>
              <p className="mt-1 text-sm text-[#6f6f6f]">Review items, apply coupon, and continue to payment.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/products" className="rounded-xl border border-[#dfdfdf] px-4 py-2 text-sm font-semibold text-[#373737]">
                Continue Shopping
              </Link>
              <Link href="/checkout" className="rounded-xl bg-[#f97316] px-4 py-2 text-sm font-black text-[#1d1d1d]">
                Proceed to Checkout
              </Link>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <section className="rounded-2xl border border-[#ececec] bg-white p-4">
              {[1, 2].map((item) => (
                <article key={item} className="mb-3 rounded-xl border border-[#efefef] bg-[#fafafa] p-3 last:mb-0">
                  <div className="flex gap-3">
                    <div className="h-20 w-20 rounded-lg bg-[linear-gradient(135deg,#f2f2f2_0%,#e9e9e9_100%)]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#212121]">Wireless Earbuds Urban {item}</p>
                      <p className="mt-1 text-xs text-[#7d7d7d]">Color: Black | Qty: 1</p>
                      <p className="mt-2 text-sm font-black text-[#ef4f4f]">INR {item === 1 ? "10,995" : "17,500"}</p>
                    </div>
                    <button className="text-xs font-semibold text-[#666]">Remove</button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="rounded-2xl border border-[#ececec] bg-white p-4">
              <h2 className="text-lg font-black text-[#1c1c1c]">Order Summary</h2>
              <div className="mt-3 space-y-2 text-sm text-[#555]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>INR 28,495</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span>INR 99</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="text-[#3a9d6d]">- INR 1,000</span>
                </div>
                <div className="border-t border-[#ececec] pt-2 text-base font-black text-[#1d1d1d]">
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span>INR 27,594</span>
                  </div>
                </div>
              </div>
              <Link href="/checkout" className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#f97316] px-4 py-3 text-sm font-black text-[#171717]">
                Continue
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

