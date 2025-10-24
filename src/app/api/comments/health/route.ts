import { NextResponse } from "next/server";

export async function GET() {
  const ok = Boolean(process.env.WP_BASE_URL || process.env.NEXT_PUBLIC_WP_BASE_URL);
  // You can also check any other required secrets here if you add them later.
  return NextResponse.json({ ok });
}
