import { PrismaClient, ProductStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Groceries", slug: "groceries" },
  { name: "Toys", slug: "toys" },
  { name: "Kitchen Utensils", slug: "kitchen-utensils" },
  { name: "Stationery", slug: "stationery" },
  { name: "Home Decor", slug: "home-decor" },
] as const;

const sampleProductImages: Record<string, string[]> = {
  "TN-RICE-5KG": ["/uploads/products/sample-rice-1.svg", "/uploads/products/sample-rice-2.svg"],
  "TN-TOY-CAR-01": ["/uploads/products/sample-toycar-1.svg", "/uploads/products/sample-toycar-2.svg"],
  "TN-KITCH-PAN-01": ["/uploads/products/sample-frypan-1.svg", "/uploads/products/sample-frypan-2.svg"],
  "TN-STAT-NOTE-01": ["/uploads/products/sample-notebook-1.svg", "/uploads/products/sample-notebook-2.svg"],
  "TN-DECOR-FRAME-01": ["/uploads/products/sample-wallart-1.svg", "/uploads/products/sample-wallart-2.svg"],
};

async function main() {
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        ...category,
        description: `${category.name} collection for Tamil Nadu households.`,
      },
      update: {
        name: category.name,
      },
    });
  }

  const groceries = await prisma.category.findUnique({ where: { slug: "groceries" } });
  const toys = await prisma.category.findUnique({ where: { slug: "toys" } });
  const kitchen = await prisma.category.findUnique({ where: { slug: "kitchen-utensils" } });
  const stationery = await prisma.category.findUnique({ where: { slug: "stationery" } });
  const decor = await prisma.category.findUnique({ where: { slug: "home-decor" } });

  if (groceries) {
    await prisma.subCategory.upsert({
      where: { categoryId_slug: { categoryId: groceries.id, slug: "rice-and-grains" } },
      create: {
        categoryId: groceries.id,
        name: "Rice & Grains",
        slug: "rice-and-grains",
      },
      update: {
        name: "Rice & Grains",
        isActive: true,
      },
    });
  }

  if (toys) {
    await prisma.subCategory.upsert({
      where: { categoryId_slug: { categoryId: toys.id, slug: "remote-toys" } },
      create: {
        categoryId: toys.id,
        name: "Remote Toys",
        slug: "remote-toys",
      },
      update: {
        name: "Remote Toys",
        isActive: true,
      },
    });
  }

  if (kitchen) {
    await prisma.subCategory.upsert({
      where: { categoryId_slug: { categoryId: kitchen.id, slug: "cookware" } },
      create: {
        categoryId: kitchen.id,
        name: "Cookware",
        slug: "cookware",
      },
      update: {
        name: "Cookware",
        isActive: true,
      },
    });
  }

  if (stationery) {
    await prisma.subCategory.upsert({
      where: { categoryId_slug: { categoryId: stationery.id, slug: "notebooks" } },
      create: {
        categoryId: stationery.id,
        name: "Notebooks",
        slug: "notebooks",
      },
      update: {
        name: "Notebooks",
        isActive: true,
      },
    });
  }

  if (decor) {
    await prisma.subCategory.upsert({
      where: { categoryId_slug: { categoryId: decor.id, slug: "wall-art" } },
      create: {
        categoryId: decor.id,
        name: "Wall Art",
        slug: "wall-art",
      },
      update: {
        name: "Wall Art",
        isActive: true,
      },
    });
  }

  const groceriesSub = groceries
    ? await prisma.subCategory.findUnique({
        where: { categoryId_slug: { categoryId: groceries.id, slug: "rice-and-grains" } },
      })
    : null;
  const toysSub = toys
    ? await prisma.subCategory.findUnique({
        where: { categoryId_slug: { categoryId: toys.id, slug: "remote-toys" } },
      })
    : null;
  const kitchenSub = kitchen
    ? await prisma.subCategory.findUnique({
        where: { categoryId_slug: { categoryId: kitchen.id, slug: "cookware" } },
      })
    : null;
  const stationerySub = stationery
    ? await prisma.subCategory.findUnique({
        where: { categoryId_slug: { categoryId: stationery.id, slug: "notebooks" } },
      })
    : null;
  const decorSub = decor
    ? await prisma.subCategory.findUnique({
        where: { categoryId_slug: { categoryId: decor.id, slug: "wall-art" } },
      })
    : null;

  if (groceries) {
    await prisma.product.upsert({
      where: { sku: "TN-RICE-5KG" },
      create: {
        name: "Ponni Raw Rice 5kg",
        slug: "ponni-raw-rice-5kg",
        sku: "TN-RICE-5KG",
        description: "Premium quality Ponni raw rice suitable for daily meals.",
        categoryId: groceries.id,
        subCategoryId: groceriesSub?.id,
        status: ProductStatus.ACTIVE,
        price: 420,
        mrp: 450,
        gstRate: 5,
        stock: 200,
        minStock: 25,
        unit: "5kg bag",
      },
      update: {
        categoryId: groceries.id,
        subCategoryId: groceriesSub?.id,
      },
    });
  }

  if (toys) {
    await prisma.product.upsert({
      where: { sku: "TN-TOY-CAR-01" },
      create: {
        name: "Remote Control Racer Car",
        slug: "remote-control-racer-car",
        sku: "TN-TOY-CAR-01",
        description: "Rechargeable racing toy with LED lights.",
        categoryId: toys.id,
        subCategoryId: toysSub?.id,
        status: ProductStatus.ACTIVE,
        price: 1199,
        mrp: 1499,
        gstRate: 12,
        stock: 80,
        minStock: 10,
      },
      update: {
        categoryId: toys.id,
        subCategoryId: toysSub?.id,
      },
    });
  }

  if (kitchen) {
    await prisma.product.upsert({
      where: { sku: "TN-KITCH-PAN-01" },
      create: {
        name: "Non-Stick Fry Pan 28cm",
        slug: "non-stick-fry-pan-28cm",
        sku: "TN-KITCH-PAN-01",
        description: "Durable non-stick fry pan suitable for daily cooking.",
        categoryId: kitchen.id,
        subCategoryId: kitchenSub?.id,
        status: ProductStatus.ACTIVE,
        price: 699,
        mrp: 899,
        gstRate: 18,
        stock: 120,
        minStock: 15,
      },
      update: {
        categoryId: kitchen.id,
        subCategoryId: kitchenSub?.id,
      },
    });
  }

  if (stationery) {
    await prisma.product.upsert({
      where: { sku: "TN-STAT-NOTE-01" },
      create: {
        name: "A4 Ruled Notebook Pack of 6",
        slug: "a4-ruled-notebook-pack-6",
        sku: "TN-STAT-NOTE-01",
        description: "High quality ruled notebook bundle for school and office.",
        categoryId: stationery.id,
        subCategoryId: stationerySub?.id,
        status: ProductStatus.ACTIVE,
        price: 249,
        mrp: 329,
        gstRate: 12,
        stock: 220,
        minStock: 30,
      },
      update: {
        categoryId: stationery.id,
        subCategoryId: stationerySub?.id,
      },
    });
  }

  if (decor) {
    await prisma.product.upsert({
      where: { sku: "TN-DECOR-FRAME-01" },
      create: {
        name: "Minimal Wall Frame Set",
        slug: "minimal-wall-frame-set",
        sku: "TN-DECOR-FRAME-01",
        description: "Set of decorative wall frames for modern homes.",
        categoryId: decor.id,
        subCategoryId: decorSub?.id,
        status: ProductStatus.ACTIVE,
        price: 799,
        mrp: 999,
        gstRate: 12,
        stock: 60,
        minStock: 8,
      },
      update: {
        categoryId: decor.id,
        subCategoryId: decorSub?.id,
      },
    });
  }

  const sampleProducts = await prisma.product.findMany({
    where: {
      sku: {
        in: Object.keys(sampleProductImages),
      },
    },
    select: {
      id: true,
      sku: true,
    },
  });

  for (const product of sampleProducts) {
    const existingImageCount = await prisma.productImage.count({
      where: { productId: product.id },
    });

    if (existingImageCount > 0) {
      continue;
    }

    const images = sampleProductImages[product.sku] ?? [];
    if (!images.length) {
      continue;
    }

    await prisma.productImage.createMany({
      data: images.map((imageUrl, index) => ({
        productId: product.id,
        imageUrl,
        sortOrder: index,
      })),
    });
  }

  const existingZone = await prisma.deliveryZone.findFirst({
    where: { name: "Tamil Nadu Metro Zone" },
    select: { id: true },
  });

  if (existingZone) {
    await prisma.deliveryZone.update({
      where: { id: existingZone.id },
      data: {
        pincodes: ["638001", "600001", "641001", "620001", "625001"],
        flatCharge: 49,
        freeAbove: 699,
        isActive: true,
      },
    });
  } else {
    await prisma.deliveryZone.create({
      data: {
        name: "Tamil Nadu Metro Zone",
        pincodes: ["638001", "600001", "641001", "620001", "625001"],
        chargeType: "FLAT",
        flatCharge: 49,
        freeAbove: 699,
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME100" },
    create: {
      code: "WELCOME100",
      title: "Welcome Offer",
      type: "FLAT",
      scope: "ORDER",
      value: 100,
      minOrderValue: 799,
      maxDiscount: 100,
      usageLimit: 10000,
      perUserLimit: 1,
      startsAt: new Date("2026-01-01"),
      endsAt: new Date("2027-01-01"),
    },
    update: {
      isActive: true,
      startsAt: new Date("2026-01-01"),
      endsAt: new Date("2027-01-01"),
    },
  });

  const passwordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@tnsuperstore.com" },
    create: {
      fullName: "TN Superstore Admin",
      email: "admin@tnsuperstore.com",
      passwordHash,
      role: "ADMIN",
      isEmailVerified: true,
    },
    update: {
      passwordHash,
      role: "ADMIN",
      isEmailVerified: true,
    },
  });

  console.log("Seed completed. Admin: admin@tnsuperstore.com / Admin@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
