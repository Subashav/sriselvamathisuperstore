import { parse } from "csv-parse/sync";
import { ProductStatus, Prisma } from "@prisma/client";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  description: true,
  price: true,
  mrp: true,
  gstRate: true,
  stock: true,
  status: true,
  isFeatured: true,
  brand: true,
  unit: true,
  weightGrams: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  subCategory: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
  _count: {
    select: {
      reviews: true,
      orderItems: true,
    },
  },
} satisfies Prisma.ProductSelect;

const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  latest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  popular: { orderItems: { _count: "desc" } },
};

export const listCatalogProducts = async (filters: {
  q?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort: "latest" | "price_asc" | "price_desc" | "popular";
  page: number;
  limit: number;
}) => {
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { sku: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.subCategorySlug ? { subCategory: { slug: filters.subCategorySlug } } : {}),
    ...(typeof filters.featured === "boolean" ? { isFeatured: filters.featured } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            gte: filters.minPrice,
            lte: filters.maxPrice,
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: productSelect,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: sortMap[filters.sort],
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
};

export const listAdminProducts = async () => {
  return prisma.product.findMany({
    select: productSelect,
    orderBy: { createdAt: "desc" },
  });
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

export const createProduct = async (input: {
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  subCategoryId?: string;
  price: number;
  mrp: number;
  gstRate: number;
  stock: number;
  minStock: number;
  brand?: string;
  unit?: string;
  weightGrams?: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  isFeatured: boolean;
  specs?: Prisma.InputJsonValue;
  images: Array<{ imageUrl: string; publicId?: string; altText?: string; sortOrder: number }>;
}) => {
  if (input.images.length < 2) {
    throw new AppError("Minimum 2 images are required", 400);
  }

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) {
    throw new AppError("Invalid category", 400);
  }

  if (input.subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: input.subCategoryId },
      select: { id: true, categoryId: true },
    });

    if (!subCategory || subCategory.categoryId !== input.categoryId) {
      throw new AppError("Invalid subcategory for selected category", 400);
    }
  }

  const created = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      description: input.description,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      price: input.price,
      mrp: input.mrp,
      gstRate: input.gstRate,
      stock: input.stock,
      minStock: input.minStock,
      brand: input.brand,
      unit: input.unit,
      weightGrams: input.weightGrams,
      status: input.status,
      isFeatured: input.isFeatured,
      specs: input.specs,
      images: {
        create: input.images,
      },
      inventoryLogs: {
        create: {
          deltaQty: input.stock,
          reason: "INITIAL_STOCK",
        },
      },
    },
    select: productSelect,
  });

  return created;
};

export const updateProduct = async (
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    sku: string;
    description: string;
    categoryId: string;
    subCategoryId?: string;
    price: number;
    mrp: number;
    gstRate: number;
    stock: number;
    minStock: number;
    brand?: string;
    unit?: string;
    weightGrams?: number;
    status: "DRAFT" | "ACTIVE" | "INACTIVE";
    isFeatured: boolean;
    specs?: Prisma.InputJsonValue;
    images: Array<{ imageUrl: string; publicId?: string; altText?: string; sortOrder: number }>;
  }>,
  actorId?: string,
) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Product not found", 404);
  }

  const effectiveCategoryId = input.categoryId ?? existing.categoryId;
  if (input.subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: input.subCategoryId },
      select: { id: true, categoryId: true },
    });

    if (!subCategory || subCategory.categoryId !== effectiveCategoryId) {
      throw new AppError("Invalid subcategory for selected category", 400);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: {
        ...input,
        images: input.images
          ? {
              deleteMany: {},
              create: input.images,
            }
          : undefined,
      },
      select: productSelect,
    });

    if (typeof input.stock === "number" && input.stock !== existing.stock) {
      await tx.inventoryMovement.create({
        data: {
          productId: id,
          deltaQty: input.stock - existing.stock,
          reason: "STOCK_ADJUSTMENT",
          createdById: actorId,
        },
      });
    }

    return product;
  });

  return updated;
};

export const deleteProduct = async (id: string) => {
  await getProductById(id);
  await prisma.product.delete({ where: { id } });
  return true;
};

export const importProductsFromCsv = async (csv: string, defaultCategoryId?: string, defaultSubCategoryId?: string) => {
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  if (!rows.length) {
    throw new AppError("CSV is empty", 400);
  }

  if (defaultCategoryId) {
    const category = await prisma.category.findUnique({ where: { id: defaultCategoryId } });
    if (!category) {
      throw new AppError("Invalid defaultCategoryId", 400);
    }
  }

  if (defaultSubCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id: defaultSubCategoryId } });
    if (!subCategory) {
      throw new AppError("Invalid defaultSubCategoryId", 400);
    }

    if (defaultCategoryId && subCategory.categoryId !== defaultCategoryId) {
      throw new AppError("defaultSubCategoryId does not belong to defaultCategoryId", 400);
    }
  }

  let createdCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const categoryId = row.categoryId || defaultCategoryId;
      if (!categoryId) {
        continue;
      }

      const subCategoryId = row.subCategoryId || defaultSubCategoryId;

      if (subCategoryId) {
        const linked = await tx.subCategory.findFirst({
          where: {
            id: subCategoryId,
            categoryId,
          },
          select: { id: true },
        });

        if (!linked) {
          continue;
        }
      }

      const exists = await tx.product.findFirst({
        where: {
          OR: [{ sku: row.sku }, { slug: row.slug }],
        },
      });

      if (exists) {
        continue;
      }

      await tx.product.create({
        data: {
          name: row.name,
          slug: row.slug,
          sku: row.sku,
          description: row.description,
          categoryId,
          subCategoryId,
          price: Number(row.price),
          mrp: Number(row.mrp || row.price),
          gstRate: Number(row.gstRate || 5),
          stock: Number(row.stock || 0),
          minStock: Number(row.minStock || 0),
          status: (row.status as ProductStatus) || ProductStatus.ACTIVE,
          brand: row.brand || undefined,
          unit: row.unit || undefined,
          isFeatured: row.isFeatured === "true",
        },
      });

      createdCount += 1;
    }
  });

  return { totalRows: rows.length, createdCount };
};
