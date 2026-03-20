export type ManagedSubCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type CategoryMeta = {
  description: string;
  subcategories: ManagedSubCategory[];
};

const META_PREFIX = "__META__";

export function slugifyLabel(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseCategoryMeta(rawDescription?: string | null): CategoryMeta {
  if (!rawDescription) {
    return { description: "", subcategories: [] };
  }

  if (!rawDescription.startsWith(META_PREFIX)) {
    return { description: rawDescription, subcategories: [] };
  }

  const payload = rawDescription.slice(META_PREFIX.length);

  try {
    const parsed = JSON.parse(payload) as Partial<CategoryMeta>;
    const subcategories = Array.isArray(parsed.subcategories)
      ? parsed.subcategories.filter((item): item is ManagedSubCategory => {
          return Boolean(
            item &&
              typeof item.id === "string" &&
              typeof item.name === "string" &&
              typeof item.slug === "string" &&
              typeof item.isActive === "boolean",
          );
        })
      : [];

    return {
      description: typeof parsed.description === "string" ? parsed.description : "",
      subcategories,
    };
  } catch {
    return { description: "", subcategories: [] };
  }
}

export function serializeCategoryMeta(meta: CategoryMeta): string {
  return `${META_PREFIX}${JSON.stringify(meta)}`;
}
