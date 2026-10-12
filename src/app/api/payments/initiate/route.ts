import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments/provider-factory";
import { decryptPaymentSecrets } from "@/lib/crypto/field-encryption";
import { getActiveProducts, priceSelection, validateProductSelection, calculateTotal } from "@/lib/catalog";
import { PENDING_PAYMENT_STALE_AFTER_MS } from "@/lib/payments/constants";
const clean = (v: unknown) => typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
export async function POST(req: NextRequest) {
  try {
    const input = await req.json(); const fullName = clean(input.fullName); const referenceNumber = clean(input.referenceNumber); const department = clean(input.department).slice(0, 100); const phone = clean(input.phone); const email = clean(input.email); const items = Array.isArray(input.items) ? input.items : [];
    if (!fullName || !referenceNumber || !department || !phone) return NextResponse.json({ error: "Name, student/reference number, department and phone are required." }, { status: 400 });
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "That email address does not look right. Fix it or leave it blank." }, { status: 400 });
    const unique = validateProductSelection(items);
    if (!unique) return NextResponse.json({ error: "Select at least one valid item." }, { status: 400 });
    // Prices always come from the database, never from the browser.
    const lineItems = priceSelection(unique, await getActiveProducts());
    if (!lineItems) return NextResponse.json({ error: "One of the selected items is no longer available. Please refresh the page and choose again." }, { status: 400 });
    const rawConfig = await prisma.paymentProviderConfiguration.findUnique({ where: { id: "singleton" } });
    if (!rawConfig?.secretKey) return NextResponse.json({ error: "Online payment has not been configured. Please contact the administrator." }, { status: 503 });
    if (rawConfig.provider !== "PAYSTACK") return NextResponse.json({ error: "The selected payment provider is not enabled for checkout." }, { status: 503 });
    const config = decryptPaymentSecrets(rawConfig); const amount = calculateTotal(lineItems);
    const student = await prisma.student.upsert({ where: { referenceNumber }, update: { fullName, department, phone, email: email || null }, create: { fullName, referenceNumber, department, phone, email: email || null } });
    const alreadyPaid = await prisma.payment.findFirst({ where: { studentId: student.id, status: "SUCCESS" } });
    if (alreadyPaid) return NextResponse.json({ error: "A successful payment already exists for this reference number. Contact the administrator if you need help." }, { status: 409 });
    const pending = await prisma.payment.findFirst({ where: { studentId: student.id, status: "PENDING", createdAt: { gt: new Date(Date.now() - PENDING_PAYMENT_STALE_AFTER_MS) } } });
    if (pending) return NextResponse.json({ error: "A payment is already being processed. Please wait about 15 minutes, or ask an administrator to cancel it so you can try again." }, { status: 409 });
    const internalReference = `PAY-${Date.now()}-${cryptoRandom()}`;
    const payment = await prisma.payment.create({ data: { studentId: student.id, provider: config.provider, internalReference, amount, currency: "GHS", items: lineItems, status: "PENDING" } });
    try {
      const result = await getPaymentProvider("PAYSTACK").initiatePayment({ amount, currency: "GHS", email: email || undefined, phone, internalReference, metadata: { studentReference: referenceNumber, studentId: student.id, paymentId: payment.id, items: lineItems }, callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin}/payment-status?ref=${encodeURIComponent(internalReference)}` }, { publicKey: config.publicKey, secretKey: config.secretKey, webhookSecret: config.webhookSecret, configValue: config.configValue, environment: config.environment });
      return NextResponse.json({ authorizationUrl: result.authorizationUrl, paymentId: payment.id, reference: internalReference });
    } catch (err) { await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: err instanceof Error ? err.message.slice(0, 500) : "Payment initialization failed" } }); throw err; }
  } catch (error) { console.error("Payment initiation failed", error); return NextResponse.json({ error: "Could not initiate payment. Please try again." }, { status: 500 }); }
}
function cryptoRandom() { return randomBytes(9).toString("hex").toUpperCase(); }
