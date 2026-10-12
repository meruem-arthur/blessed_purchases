import { NextResponse } from "next/server";
import { getActiveProducts } from "@/lib/catalog";

// Public: the items shown on the checkout page. Always read fresh so a price
// change by a Super Admin shows up immediately.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ products: await getActiveProducts() });
  } catch (e) {
    console.error("Could not load products", e);
    return NextResponse.json({ error: "Could not load items. Please try again." }, { status: 500 });
  }
}
