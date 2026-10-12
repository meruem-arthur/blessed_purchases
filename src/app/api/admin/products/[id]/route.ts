import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/authorization";
import { captureError } from "@/lib/monitoring/capture-error";
import { fail, productSchema, productView } from "@/lib/product-admin";

// Super Admin only. Past payments keep the name and price they were bought at
// (they are copied onto the payment), so editing or deleting an item here never
// changes an existing receipt.
const partial = productSchema.partial();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSuperAdmin();
    const parsed = partial.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid item" }, { status: 400 });
    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    const product = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
    await prisma.auditLog.create({ data: { userId: user.id, action: "PRODUCT_UPDATED", entity: "Product", entityId: product.id, metadata: { before: { label: existing.label, amount: Number(existing.amount), active: existing.active }, after: { label: product.label, amount: Number(product.amount), active: product.active } } } }).catch(() => {});
    return NextResponse.json({ product: productView(product) });
  } catch (e: any) { if (!e?.status) captureError(e); return fail(e); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireSuperAdmin();
    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    await prisma.product.delete({ where: { id: params.id } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "PRODUCT_DELETED", entity: "Product", entityId: params.id, metadata: { label: existing.label, amount: Number(existing.amount) } } }).catch(() => {});
    return NextResponse.json({ deleted: true });
  } catch (e: any) { if (!e?.status) captureError(e); return fail(e); }
}
