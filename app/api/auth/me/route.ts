import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, admin: null }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, admin: session });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verifying session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
