import { PrismaClient, ProductStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching products from DummyJSON...");
  const response = await fetch("https://dummyjson.com/products?limit=60");
  const data = await response.json();
  const products = data.products;

  console.log(`Fetched ${products.length} products. Inserting...`);

  // First, map categories to our DB
  const categoryMap = new Map();

  for (const p of products) {
    const categoryName = p.category
      .split("-")
      .map((c: string) => c.charAt(0).toUpperCase() + c.slice(1))
      .join(" ");

    const slug = p.category.toLowerCase().replace(/\s+/g, '-');

    if (!categoryMap.has(slug)) {
      const dbCategory = await prisma.category.upsert({
        where: { slug: slug },
        create: {
          name: categoryName,
          slug: slug,
          description: `${categoryName} category from DummyJSON`,
        },
        update: {},
      });
      categoryMap.set(slug, dbCategory.id);
    }
  }

  // Iterate over products and insert
  for (const p of products) {
    const categoryId = categoryMap.get(p.category.toLowerCase().replace(/\s+/g, '-'));
    const sku = `DUMMY-${p.sku || p.id}`;
    
    // Check if product exists to avoid duplicates
    const existing = await prisma.product.findUnique({
      where: { sku: sku }
    });

    if (existing) {
      continue;
    }

    const price = Math.round(p.price * 80); // convert to INR approx
    const mrp = Math.round((p.price / (1 - (p.discountPercentage || 10) / 100)) * 80);

    const dbProduct = await prisma.product.create({
      data: {
        name: p.title,
        slug: `${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${p.id}`,
        sku: sku,
        description: p.description,
        brand: p.brand || null,
        weightGrams: p.weight > 0 ? p.weight * 100 : 500, // guess weight 
        status: ProductStatus.ACTIVE,
        price: price,
        mrp: mrp > price ? mrp : price + 50,
        gstRate: 18,
        stock: p.stock || 50,
        minStock: 5,
        categoryId: categoryId,
        isFeatured: p.rating > 4.5,
      }
    });

    // Insert images
    if (p.images && p.images.length > 0) {
      await prisma.productImage.createMany({
        data: p.images.map((imgUrl: string, idx: number) => ({
          productId: dbProduct.id,
          imageUrl: imgUrl,
          sortOrder: idx,
        }))
      });
    }

    console.log(`Inserted product: ${dbProduct.name}`);
  }

  console.log("DummyJSON seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
