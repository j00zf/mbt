import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import {
  sanitizeText,
  sanitizeEmail,
  containsSqlInjection,
  isAuthorizedAdminPhone,
} from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    // Validate phone number presence and authorization
    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required for administrator registration." },
        { status: 400 }
      );
    }

    if (containsSqlInjection(phone)) {
      return NextResponse.json(
        { error: "Invalid characters detected in phone number." },
        { status: 400 }
      );
    }

    // Verify on server side against secure environment variable and database
    const { authorized, normalizedPhone } = await isAuthorizedAdminPhone(phone);
    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "Access Denied: This phone number is not authorized for administrator registration.",
        },
        { status: 403 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name must be provided as text." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email must be provided as text." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password must be provided as text." },
        { status: 400 }
      );
    }

    // Check for SQL injection patterns
    if (
      containsSqlInjection(name) ||
      containsSqlInjection(email) ||
      containsSqlInjection(password)
    ) {
      return NextResponse.json(
        { error: "Suspicious characters or SQL patterns detected." },
        { status: 400 }
      );
    }

    // Sanitize name: strip any HTML tags, control chars, and enforce length
    const cleanName = sanitizeText(name, 70);
    if (cleanName.length < 2) {
      return NextResponse.json(
        { error: "Name must be between 2 and 70 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6 || password.length > 100) {
      return NextResponse.json(
        { error: "Password must be between 6 and 100 characters long." },
        { status: 400 }
      );
    }

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

    // Insert new admin with phone and default status 'inactive'
    let newAdmin: {
      id: number;
      name: string;
      email: string;
      phone?: string | null;
      status?: string;
      created_at: string;
    } | null = null;

    // Primary attempt: insert with both phone and status
    const { data: insertedFull, error: insertError } = await supabase
      .from("admins")
      .insert([
        {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          phone: normalizedPhone,
          status: "inactive",
        },
      ])
      .select("id, name, email, phone, status, created_at")
      .single();

    if (insertError) {
      console.warn("Full insert failed, attempting schema-compatible fallbacks:", insertError.message);

      // Fallback 1: 'phone' column missing, insert with status only
      if (insertError.code === "PGRST204" || insertError.message?.includes("phone")) {
        const { data: insertedWithoutPhone, error: noPhoneErr } = await supabase
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

        if (noPhoneErr) {
          // Fallback 2: both phone and status columns missing
          if (noPhoneErr.code === "PGRST204" || noPhoneErr.message?.includes("status")) {
            const { data: legacyAdmin, error: legacyErr } = await supabase
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

            if (legacyErr) {
              console.error("Supabase legacy insert error:", legacyErr);
              return NextResponse.json(
                { error: legacyErr.message || "Failed to create admin record." },
                { status: 500 }
              );
            }
            newAdmin = { ...legacyAdmin, phone: normalizedPhone, status: "inactive" };
          } else {
            console.error("Supabase insert without phone error:", noPhoneErr);
            return NextResponse.json(
              { error: noPhoneErr.message || "Failed to create admin record." },
              { status: 500 }
            );
          }
        } else {
          newAdmin = { ...insertedWithoutPhone, phone: normalizedPhone };
        }
      } else if (insertError.message?.includes("status")) {
        // Fallback 3: 'status' column missing, try with phone only
        const { data: withPhoneOnly, error: withPhoneErr } = await supabase
          .from("admins")
          .insert([
            {
              name: cleanName,
              email: cleanEmail,
              password: hashedPassword,
              phone: normalizedPhone,
            },
          ])
          .select("id, name, email, phone, created_at")
          .single();

        if (withPhoneErr) {
          console.error("Supabase insert error:", withPhoneErr);
          return NextResponse.json(
            { error: withPhoneErr.message || "Failed to create admin record." },
            { status: 500 }
          );
        }
        newAdmin = { ...withPhoneOnly, status: "inactive" };
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
      newAdmin = insertedFull;
    }

    return NextResponse.json({
      success: true,
      message:
        "Admin account created successfully! Your status is currently 'inactive' and requires approval by an active administrator before you can sign in.",
      requiresActivation: true,
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone || normalizedPhone,
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
