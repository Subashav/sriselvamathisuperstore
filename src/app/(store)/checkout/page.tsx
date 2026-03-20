import Link from "next/link";

export default function CheckoutPage() {
  return (
    <main className="uni-shell min-h-screen">
      <div className="uni-glow uni-glow-left" aria-hidden="true" />
      <div className="uni-glow uni-glow-right" aria-hidden="true" />

      <section className="bg-black px-4 py-2 text-[11px] text-white sm:px-7 sm:text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Secure payment enabled</p>
          <p className="hidden text-center font-medium md:block">UPI, CARD, NET_BANKING, WALLET, COD</p>
          <p className="font-semibold">GST-ready invoice</p>
        </div>
      </section>

      <section className="bg-white px-4 pb-8 pt-5 sm:px-7">
        <div className="mx-auto max-w-[1180px]">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-[#1a1a1a]">Checkout</h1>
              <p className="mt-1 text-sm text-[#6f6f6f]">Confirm address, payment method, and place order.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/cart" className="rounded-xl border border-[#dfdfdf] px-4 py-2 text-sm font-semibold text-[#373737]">
                Back to Cart
              </Link>
              <Link href="/orders" className="rounded-xl bg-[#ffcc17] px-4 py-2 text-sm font-black text-[#1d1d1d]">
                View Orders
              </Link>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <section className="space-y-4">
              <article className="rounded-2xl border border-[#ececec] bg-white p-4">
                <h2 className="text-lg font-black text-[#1d1d1d]">1. Delivery Address</h2>
                <p className="mt-2 text-sm text-[#676767]">No. 41, Nalli Hospital Road, Erode - 638001</p>
                <button className="mt-3 rounded-lg border border-[#dfdfdf] px-3 py-2 text-xs font-bold text-[#454545]">Change</button>
              </article>

              <article className="rounded-2xl border border-[#ececec] bg-white p-4">
                <h2 className="text-lg font-black text-[#1d1d1d]">2. Payment Method</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    "UPI",
                    "CARD",
                    "NET BANKING",
                    "WALLET",
                    "COD",
                  ].map((method) => (
                    <label key={method} className="flex items-center gap-2 rounded-lg border border-[#ededed] px-3 py-2 text-sm font-semibold text-[#444]">
                      <input type="radio" name="payment" defaultChecked={method === "UPI"} />
                      {method}
                    </label>
                  ))}
                </div>
              </article>
            </section>

            <aside className="rounded-2xl border border-[#ececec] bg-white p-4">
              <h2 className="text-lg font-black text-[#1c1c1c]">Payment Summary</h2>
              <div className="mt-3 space-y-2 text-sm text-[#555]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>INR 28,495</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GST + Delivery</span>
                  <span>INR 1,215</span>
                </div>
                <div className="border-t border-[#ececec] pt-2 text-base font-black text-[#1d1d1d]">
                  <div className="flex items-center justify-between">
                    <span>Total Payable</span>
                    <span>INR 29,710</span>
                  </div>
                </div>
              </div>
              <Link href="/orders" className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#ffcc17] px-4 py-3 text-sm font-black text-[#171717]">
                Place Order
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
