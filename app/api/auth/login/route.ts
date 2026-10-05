import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyPassword, setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query admin by email
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, name, email, password, created_at")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("Supabase admin lookup error:", error);
      return NextResponse.json(
        { error: error.message || "Database lookup failed." },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Set cookie session
    await setAdminSession({
      id: Number(admin.id),
      name: admin.name,
      email: admin.email,
      loginTime: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Login successful!",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        created_at: admin.created_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Login exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
