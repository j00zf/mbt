import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearAdminSession();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error during logout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
