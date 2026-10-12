import { NextResponse } from "next/server";
import { z } from "zod";

// Shared by the Super Admin item routes. (Kept out of the route files because
// Next.js only allows HTTP-method exports there.)
export const productSchema = z.object({
  label: z.string().trim().min(1, "Enter an item name").max(120, "Item name is too long"),
  // Whole pesewas only, so what is shown, charged and printed always agree.
  amount: z.coerce.number().positive("Price must be more than 0").max(1_000_000, "Price is too large").refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Use at most 2 decimal places"),
  active: z.boolean().optional(),
});

export const productView = (p: { id: string; label: string; amount: unknown; active: boolean; sortOrder: number }) => ({
  id: p.id, label: p.label, amount: Number(p.amount), active: p.active, sortOrder: p.sortOrder,
});

export const fail = (e: any) => NextResponse.json({ error: e?.status === 401 ? "Sign in required" : e?.status === 403 ? "Super Admin access required" : "Something went wrong" }, { status: e?.status || 500 });
