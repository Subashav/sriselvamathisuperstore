import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleProductImages: Record<string, string[]> = {
  "TN-RICE-5KG": ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80"],
  "TN-TOY-CAR-01": ["https://images.unsplash.com/photo-1596461404969-9ce20c71422b?w=500&q=80"],
  "TN-KITCH-PAN-01": ["https://images.unsplash.com/photo-1584281723522-87063d8ff1b9?w=500&q=80"],
  "TN-STAT-NOTE-01": ["https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&q=80"],
  "TN-DECOR-FRAME-01": ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&q=80"]
};

async function main() {
  console.log("Updating existing base products with real images...");
  for (const [sku, images] of Object.entries(sampleProductImages)) {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (product) {
      await prisma.productImage.deleteMany({
        where: { productId: product.id }
      });
      await prisma.productImage.createMany({
        data: images.map((imageUrl, index) => ({
          productId: product.id,
          imageUrl,
          sortOrder: index,
        }))
      });
      console.log(`Updated images for ${sku}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
