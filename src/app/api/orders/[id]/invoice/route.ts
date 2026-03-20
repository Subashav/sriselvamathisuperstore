import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { requireAdmin, requireUser } from "@/lib/auth/guards";
import { getOrderById } from "@/modules/orders/order.service";

type Params = {
  params: Promise<{ id: string }>;
};

const buildInvoicePdf = (order: Awaited<ReturnType<typeof getOrderById>>) => {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text("Tamil Nadu Superstore Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Order Number: ${order.orderNumber}`);
    doc.text(`Order Id: ${order.id}`);
    doc.text(`Placed At: ${new Date(order.placedAt).toLocaleString("en-IN")}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown(1);

    doc.fontSize(12).text("Items", { underline: true });
    doc.moveDown(0.4);

    for (const item of order.items) {
      doc
        .fontSize(10)
        .text(`${item.productName} (${item.sku}) x ${item.quantity} - INR ${item.totalPrice.toString()}`);
    }

    doc.moveDown(1);
    doc.fontSize(11).text(`Sub Total: INR ${order.subTotal.toString()}`);
    doc.text(`Tax: INR ${order.taxAmount.toString()}`);
    doc.text(`Discount: INR ${order.discountAmount.toString()}`);
    doc.text(`Delivery Charge: INR ${order.deliveryCharge.toString()}`);
    doc.fontSize(13).text(`Total: INR ${order.totalAmount.toString()}`, { underline: true });

    doc.end();
  });
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get("mode") === "admin";

    const order = isAdmin
      ? await (async () => {
          await requireAdmin(request);
          return getOrderById(id);
        })()
      : await (async () => {
          const user = await requireUser(request);
          return getOrderById(id, user.id);
        })();

    const pdf = await buildInvoicePdf(order);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${order.orderNumber}.pdf`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
