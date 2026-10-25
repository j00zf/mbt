import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  normalizePhoneNumber,
  sanitizeText,
  containsSqlInjection,
  arePhonesEqual,
  getEnvAuthorizedPhones,
} from "@/lib/security";
import {
  getLocalAuthorizedPhones,
  addLocalAuthorizedPhone,
  deleteLocalAuthorizedPhone,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface AuthorizedPhoneItem {
  id?: number | string;
  phone: string;
  note?: string | null;
  source: "database" | "local" | "environment";
  isRegistered?: boolean;
  registeredAdminName?: string | null;
  registeredAdminEmail?: string | null;
  created_at?: string;
}

/**
 * GET /api/admin/authorized-phones
 */
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get existing registered admins to determine registration status & include their numbers
    let registeredAdmins: { id: number; name: string; email: string; phone?: string | null; created_at?: string }[] = [];
    try {
      const { data: adminData } = await supabaseAdmin
        .from("admins")
        .select("id, name, email, phone, created_at");
      if (adminData) {
        registeredAdmins = adminData;
      }
    } catch {
      // Ignore if column not found
    }

    // 2. Query Supabase table: authorized_admin_phones (if present)
    let dbPhones: { id: number; phone: string; note?: string | null; created_at?: string }[] = [];
    let tableExists = true;

    try {
      const { data, error } = await supabaseAdmin
        .from("authorized_admin_phones")
        .select("id, phone, note, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        tableExists = false;
      } else if (data) {
        dbPhones = data;
      }
    } catch {
      tableExists = false;
    }

    // 3. Query local persistent storage (both disk & memory)
    const localPhones = getLocalAuthorizedPhones();

    // 4. Load environment-authorized phones (reads .env.local on disk dynamically + process.env)
    const envPhoneList = getEnvAuthorizedPhones();

    // Combine and format the list
    const combined: AuthorizedPhoneItem[] = [];

    // Add database phones
    for (const item of dbPhones) {
      const normalized = normalizePhoneNumber(item.phone);
      if (!normalized) continue;
      const matchedAdmin = registeredAdmins.find(
        (a) => a.phone && arePhonesEqual(a.phone, normalized)
      );

      combined.push({
        id: item.id,
        phone: normalized,
        note: item.note || null,
        source: "database",
        isRegistered: Boolean(matchedAdmin),
        registeredAdminName: matchedAdmin?.name || null,
        registeredAdminEmail: matchedAdmin?.email || null,
        created_at: item.created_at,
      });
    }

    // Add local phones (if not in combined)
    for (const item of localPhones) {
      const normalized = normalizePhoneNumber(item.phone);
      if (!normalized) continue;
      const alreadyPresent = combined.some((c) => arePhonesEqual(c.phone, normalized));
      if (!alreadyPresent) {
        const matchedAdmin = registeredAdmins.find(
          (a) => a.phone && arePhonesEqual(a.phone, normalized)
        );

        combined.push({
          id: item.id,
          phone: normalized,
          note: item.note || null,
          source: "local",
          isRegistered: Boolean(matchedAdmin),
          registeredAdminName: matchedAdmin?.name || null,
          registeredAdminEmail: matchedAdmin?.email || null,
          created_at: item.created_at,
        });
      }
    }

    // Add environment phones
    for (const envP of envPhoneList) {
      const normalizedEnv = normalizePhoneNumber(envP);
      if (!normalizedEnv) continue;
      const alreadyInList = combined.some((c) => arePhonesEqual(c.phone, normalizedEnv));

      if (!alreadyInList) {
        const matchedAdmin = registeredAdmins.find(
          (a) => a.phone && arePhonesEqual(a.phone, normalizedEnv)
        );

        combined.push({
          id: `env-${normalizedEnv}`,
          phone: normalizedEnv,
          note: "Default System Administrator Invite",
          source: "environment",
          isRegistered: Boolean(matchedAdmin),
          registeredAdminName: matchedAdmin?.name || null,
          registeredAdminEmail: matchedAdmin?.email || null,
        });
      }
    }

    // Add any registered admin phone numbers that weren't in the lists
    for (const admin of registeredAdmins) {
      if (!admin.phone) continue;
      const normalizedAdminPhone = normalizePhoneNumber(admin.phone);
      if (!normalizedAdminPhone) continue;

      const alreadyInList = combined.some((c) => arePhonesEqual(c.phone, normalizedAdminPhone));
      if (!alreadyInList) {
        combined.push({
          id: `admin-${admin.id}`,
          phone: normalizedAdminPhone,
          note: `System Administrator (${admin.name})`,
          source: "database",
          isRegistered: true,
          registeredAdminName: admin.name,
          registeredAdminEmail: admin.email,
          created_at: admin.created_at,
        });
      }
    }

    return NextResponse.json(
      {
        phones: combined,
        tableExists,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/authorized-phones
 */
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phone, note } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (containsSqlInjection(phone) || (note && containsSqlInjection(note))) {
      return NextResponse.json(
        { error: "Suspicious characters or SQL patterns detected." },
        { status: 400 }
      );
    }

    const cleanPhone = normalizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 10 || !/^[+]?\d{10,15}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number with at least 10 digits (e.g. 7594827137 or +917594827137)." },
        { status: 400 }
      );
    }

    const cleanNote = note ? sanitizeText(note, 200) : null;

    // 1. Save to local persistent storage (memory and data file)
    const savedLocal = addLocalAuthorizedPhone({
      phone: cleanPhone,
      note: cleanNote,
    });

    // 2. Also attempt to save to Supabase public.authorized_admin_phones (if table exists)
    let dbSuccess = false;
    try {
      const { data: existingRows } = await supabaseAdmin
        .from("authorized_admin_phones")
        .select("id, phone");

      const alreadyInDb = existingRows && existingRows.some((r: { phone: string }) => arePhonesEqual(r.phone, cleanPhone));
      if (!alreadyInDb) {
        const { error: insertErr } = await supabaseAdmin
          .from("authorized_admin_phones")
          .insert([
            {
              phone: cleanPhone,
              note: cleanNote,
            },
          ]);
        if (!insertErr) {
          dbSuccess = true;
        }
      } else {
        dbSuccess = true;
      }
    } catch {
      // Table might not exist yet, local storage took care of it
    }

    const item: AuthorizedPhoneItem = {
      id: savedLocal.id,
      phone: cleanPhone,
      note: cleanNote,
      source: "local",
      isRegistered: false,
      created_at: savedLocal.created_at,
    };

    return NextResponse.json({
      success: true,
      message: `Phone number ${cleanPhone} is now authorized for administrator registration!`,
      phone: cleanPhone,
      item,
      dbSynced: dbSuccess,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/authorized-phones
 */
export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, phone } = body;

    if (!id && !phone) {
      return NextResponse.json(
        { error: "Provide either phone ID or phone number to revoke." },
        { status: 400 }
      );
    }

    // 1. Delete from local storage (both memory and file)
    if (phone) {
      deleteLocalAuthorizedPhone(phone);
    } else if (id) {
      deleteLocalAuthorizedPhone(id);
    }

    // 2. Delete from Supabase public.authorized_admin_phones
    try {
      let query = supabaseAdmin.from("authorized_admin_phones").delete();
      if (id && typeof id === "number") {
        query = query.eq("id", id);
      } else if (phone) {
        const cleanPhone = normalizePhoneNumber(phone);
        query = query.eq("phone", cleanPhone);
      }
      await query;
    } catch {
      // Ignore if table does not exist
    }

    return NextResponse.json({
      success: true,
      message: "Authorization revoked successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

