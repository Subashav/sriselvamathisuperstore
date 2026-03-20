import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180),
  sku: z.string().min(2).max(64),
  description: z.string().min(8).max(5000),
  categoryId: z.string().cuid(),
  subCategoryId: z.string().cuid().optional(),
  price: z.number().positive(),
  mrp: z.number().positive(),
  gstRate: z.number().min(0).max(28),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0).default(0),
  brand: z.string().max(120).optional(),
  unit: z.string().max(50).optional(),
  weightGrams: z.number().int().positive().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("ACTIVE"),
  isFeatured: z.boolean().default(false),
  specs: z.record(z.string(), z.any()).optional(),
  images: z
    .array(
      z.object({
        imageUrl: z.string().url(),
        publicId: z.string().optional(),
        altText: z.string().max(255).optional(),
        sortOrder: z.number().int().min(0).default(0),
      }),
    )
    .min(2, "Minimum 2 images are required")
    .default([]),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productFilterSchema = z.object({
  q: z.string().optional(),
  categorySlug: z.string().optional(),
  subCategorySlug: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["latest", "price_asc", "price_desc", "popular"]).default("latest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
});

export const csvImportSchema = z.object({
  csv: z.string().min(1),
  defaultCategoryId: z.string().cuid().optional(),
  defaultSubCategoryId: z.string().cuid().optional(),
});
