import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/authorization";
import { captureError } from "@/lib/monitoring/capture-error";
import { fail, productSchema, productView } from "@/lib/product-admin";

// Super Admin only: the items on sale at checkout.
export async function GET() {
  try {
    await requireSuperAdmin();
    const rows = await prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json({ products: rows.map(productView) });
  } catch (e: any) { if (!e?.status) captureError(e); return fail(e); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSuperAdmin();
    const parsed = productSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid item" }, { status: 400 });
    const last = await prisma.product.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const product = await prisma.product.create({ data: { label: parsed.data.label, amount: parsed.data.amount, active: parsed.data.active ?? true, sortOrder: (last?.sortOrder ?? 0) + 1 } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "PRODUCT_CREATED", entity: "Product", entityId: product.id, metadata: { label: product.label, amount: Number(product.amount) } } }).catch(() => {});
    return NextResponse.json({ product: productView(product) }, { status: 201 });
  } catch (e: any) { if (!e?.status) captureError(e); return fail(e); }
}
