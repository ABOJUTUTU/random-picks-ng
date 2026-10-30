export type DraftProduct = {
  id: string;
  sku: string;
  category: string;
  name: string;
  description: string;
  price: number | null;
  stock: number | null;
  colors: string[];
  types: string[];
  images: string[];
  verified: boolean;
  status: "draft" | "published" | "rejected";
  product_id: number | null;
  created_at: string;
};

function hasRealName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 &&
    !/\bdraft[\s_-]*\d+$/i.test(trimmed) &&
    !/^(?:draft|untitled|new product|placeholder|sample product|test product)$/i.test(trimmed);
}

function isHttpsImage(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function draftReadiness(draft: DraftProduct): string[] {
  const reasons: string[] = [];
  if (draft.verified !== true) reasons.push("Verify the product details.");
  if (!hasRealName(draft.name)) reasons.push("Enter the real product name.");
  if (draft.price === null || !Number.isFinite(draft.price) || draft.price <= 0) {
    reasons.push("Enter a selling price greater than zero.");
  }
  if (draft.stock === null || !Number.isInteger(draft.stock) || draft.stock < 0) {
    reasons.push("Enter a whole stock quantity of zero or more.");
  }
  if (!draft.images.length || !draft.images.every(isHttpsImage)) reasons.push("Add HTTPS product image URLs.");
  return reasons;
}

export function normalizeCategories(input: string): string[] {
  const categories: string[] = [];
  const seen = new Set<string>();
  for (const item of input.split(/[,\r\n]+/)) {
    const category = item.trim();
    const key = category.toLowerCase();
    const hasControls = Array.from(category).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
    });
    if (category.length < 2 || category.length > 60 || hasControls || seen.has(key)) continue;
    categories.push(category);
    seen.add(key);
    if (categories.length === 20) break;
  }
  return categories;
}

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

export function formatDraftPrice(price: number | null): string {
  return price !== null && Number.isFinite(price) && price > 0 ? naira.format(price) : "Not set";
}
