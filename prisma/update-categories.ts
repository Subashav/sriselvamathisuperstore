import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoryImages: Record<string, string> = {
  "groceries": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
  "toys": "https://images.unsplash.com/photo-1596461404969-9ce20c71422b?w=500&q=80",
  "kitchen-utensils": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&q=80",
  "stationery": "https://images.unsplash.com/photo-1497032205915-1fa08d48d5c1?w=500&q=80",
  "home-decor": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80",
  "beauty": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80",
  "fragrances": "https://images.unsplash.com/photo-1594035910387-fea477271b1d?w=500&q=80",
  "furniture": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80",
  "home-decoration": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80",
  "kitchen-accessories": "https://images.unsplash.com/photo-1584281723522-87063d8ff1b9?w=500&q=80"
};

async function main() {
  console.log("Updating categories with real images...");
  for (const [slug, imageUrl] of Object.entries(categoryImages)) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (category) {
      await prisma.category.update({
        where: { id: category.id },
        data: { imageUrl }
      });
      console.log(`Updated image for category: ${slug}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
