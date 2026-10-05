import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admins, error } = await supabase
      .from("admins")
      .select("id, name, email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admins:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch admins" },
        { status: 500 }
      );
    }

    return NextResponse.json({ admins: admins || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
