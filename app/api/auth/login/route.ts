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
    // Query admin by email (attempting to select status if column exists)
    let admin: { id: number; name: string; email: string; password: string; status?: string; created_at: string } | null = null;
    const { data: adminWithStatus, error: queryError } = await supabase
      .from("admins")
      .select("id, name, email, password, status, created_at")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (queryError) {
      if (queryError.code === "PGRST204" || queryError.message?.includes("status")) {
        // Fallback for legacy database before status column migration
        const { data: legacyAdmin, error: legacyError } = await supabase
          .from("admins")
          .select("id, name, email, password, created_at")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (legacyError) {
          console.error("Supabase admin lookup error:", legacyError);
          return NextResponse.json({ error: legacyError.message || "Database lookup failed." }, { status: 500 });
        }
        admin = legacyAdmin ? { ...legacyAdmin, status: "active" } : null;
      } else {
        console.error("Supabase admin lookup error:", queryError);
        return NextResponse.json({ error: queryError.message || "Database lookup failed." }, { status: 500 });
      }
    } else {
      admin = adminWithStatus;
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

    // Verify admin status: ONLY ACTIVE ADMINS CAN LOGIN
    const currentStatus = (admin.status || "active").toLowerCase();
    if (currentStatus === "inactive") {
      return NextResponse.json(
        {
          error: "Your admin account is currently inactive. It must be approved and activated by an existing active administrator before you can log in.",
          inactive: true,
        },
        { status: 403 }
      );
    }

    // Set cookie session
    await setAdminSession({
      id: Number(admin.id),
      name: admin.name,
      email: admin.email,
      status: currentStatus,
      loginTime: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: "Login successful!",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        status: currentStatus,
        created_at: admin.created_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Login exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
