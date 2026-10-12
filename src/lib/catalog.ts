// Checkout catalogue. Items and prices live in the database (table `products`)
// and are managed by a Super Admin under Admin > Items & prices. The server
// always prices an order from the database - the checkout page, the payment
// API, receipts and SMS never trust an amount sent by the browser.

export type CatalogProduct = { id: string; label: string; amount: number };
export type LineItem = { id: string; label: string; amount: number };

/** Shape check only: a non-empty array of unique strings. Returns the ids, or null. */
export function validateProductSelection(items: unknown): string[] | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  if (!items.every((id) => typeof id === "string" && id.length > 0)) return null;
  const unique = [...new Set(items as string[])];
  return unique.length === items.length ? unique : null;
}

/**
 * Prices a selection against the active catalogue. Returns null if any id is
 * not an active item, so a hidden or deleted item can never be bought.
 */
export function priceSelection(ids: string[], active: CatalogProduct[]): LineItem[] | null {
  const byId = new Map(active.map((p) => [p.id, p]));
  const lines: LineItem[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (!p) return null;
    lines.push({ id: p.id, label: p.label, amount: p.amount });
  }
  return lines;
}

export function calculateTotal(lines: { amount: number }[]): number {
  // Work in pesewas so sums like 0.1 + 0.2 never drift.
  return lines.reduce((sum, l) => sum + Math.round(l.amount * 100), 0) / 100;
}

/** Active items in display order, with amounts as plain numbers. */
export async function getActiveProducts(): Promise<CatalogProduct[]> {
  const { prisma } = await import("@/lib/db");
  const rows = await prisma.product.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return rows.map((r: { id: string; label: string; amount: unknown }) => ({ id: r.id, label: r.label, amount: Number(r.amount) }));
}
