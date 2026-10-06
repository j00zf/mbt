import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword, setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Check if email already registered
    const { data: existingAdmin, error: checkError } = await supabase
      .from("admins")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Supabase check error:", checkError);
      return NextResponse.json(
        {
          error: checkError.message || "Failed to query the database. Check RLS or table settings.",
          details: checkError,
        },
        { status: 500 }
      );
    }

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin with this email address already exists." },
        { status: 409 }
      );
    }

    // Hash the password securely
    const hashedPassword = await hashPassword(password);

    // Insert new admin with default status 'inactive'
    let newAdmin: { id: number; name: string; email: string; status?: string; created_at: string } | null = null;
    const { data: insertedWithStatus, error: insertError } = await supabase
      .from("admins")
      .insert([
        {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          status: "inactive",
        },
      ])
      .select("id, name, email, status, created_at")
      .single();

    if (insertError) {
      // If 'status' column does not exist yet in schema (PGRST204), fallback to inserting without status
      if (insertError.code === "PGRST204" || insertError.message?.includes("status")) {
        console.warn("Status column not found on admins table, inserting without status:", insertError.message);
        const { data: fallbackAdmin, error: fallbackError } = await supabase
          .from("admins")
          .insert([
            {
              name: cleanName,
              email: cleanEmail,
              password: hashedPassword,
            },
          ])
          .select("id, name, email, created_at")
          .single();

        if (fallbackError) {
          console.error("Supabase fallback insert error:", fallbackError);
          return NextResponse.json(
            {
              error: fallbackError.message || "Failed to create admin record.",
              details: fallbackError,
            },
            { status: 500 }
          );
        }
        newAdmin = { ...fallbackAdmin, status: "inactive" };
      } else {
        console.error("Supabase insert error:", insertError);
        return NextResponse.json(
          {
            error: insertError.message || "Failed to create admin record.",
            details: insertError,
          },
          { status: 500 }
        );
      }
    } else {
      newAdmin = insertedWithStatus;
    }

    // Notice: We do NOT call setAdminSession here because the newly registered admin
    // has status 'inactive' and must be approved/activated by another active admin first!

    return NextResponse.json({
      success: true,
      message:
        "Admin account created successfully! Your status is currently 'inactive' and requires approval by an active administrator before you can sign in.",
      requiresActivation: true,
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        status: newAdmin.status || "inactive",
        created_at: newAdmin.created_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Registration exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
