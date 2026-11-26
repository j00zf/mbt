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

function isMissingTableError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return (
    err.code === "PGRST205" ||
    err.code === "42P01" ||
    Boolean(err.message?.includes("does not exist")) ||
    Boolean(err.message?.includes("schema cache"))
  );
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

    let body: { phone?: unknown; note?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { phone, note } = body;

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (note !== undefined && note !== null && typeof note !== "string") {
      return NextResponse.json(
        { error: "Note must be text." },
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

    // 1. Attempt to save to Supabase public.authorized_admin_phones first
    let dbSuccess = false;
    let tableExists = true;
    let dbErrorMsg: string | null = null;
    let dbRow: { id: number; phone: string; note?: string | null; created_at?: string } | null = null;

    try {
      const { data: existingRows, error: selectErr } = await supabaseAdmin
        .from("authorized_admin_phones")
        .select("id, phone, note, created_at");

      if (selectErr) {
        if (isMissingTableError(selectErr)) {
          tableExists = false;
        } else {
          dbErrorMsg = selectErr.message || "Failed to query authorized_admin_phones table.";
        }
      } else {
        const existingRow = (existingRows || []).find((r: { phone: string }) =>
          arePhonesEqual(r.phone, cleanPhone)
        );
        if (existingRow) {
          dbRow = existingRow;
          dbSuccess = true;
        } else {
          const { data: insertedRow, error: insertErr } = await supabaseAdmin
            .from("authorized_admin_phones")
            .insert([
              {
                phone: cleanPhone,
                note: cleanNote,
              },
            ])
            .select("id, phone, note, created_at")
            .single();

          if (insertErr) {
            if (isMissingTableError(insertErr)) {
              tableExists = false;
            } else {
              dbErrorMsg = insertErr.message || "Failed to save phone number to database.";
            }
          } else {
            dbRow = insertedRow;
            dbSuccess = true;
          }
        }
      }
    } catch (err: unknown) {
      dbErrorMsg = err instanceof Error ? err.message : "Database connection failed.";
    }

    // 2. If table exists in Supabase and DB operation failed for a non-missing-table error, report it
    if (tableExists && !dbSuccess && dbErrorMsg) {
      return NextResponse.json(
        { error: dbErrorMsg, tableExists: true, dbSynced: false },
        { status: 500 }
      );
    }

    // 3. Save to local persistent storage (disk + shared memory fallback)
    const { item: savedLocal, persistedToDisk } = addLocalAuthorizedPhone({
      phone: cleanPhone,
      note: cleanNote,
    });

    // If neither Supabase nor local disk persisted it (e.g. serverless read-only filesystem without DB table), fail loudly
    if (!dbSuccess && !persistedToDisk) {
      return NextResponse.json(
        {
          error:
            "Could not persist phone number: the 'public.authorized_admin_phones' table has not been created in Supabase yet and local disk storage is read-only. Please run the SQL migration in Supabase.",
          tableNotCreated: true,
          tableExists: false,
          dbSynced: false,
        },
        { status: 503 }
      );
    }

    const item: AuthorizedPhoneItem = dbRow
      ? {
          id: dbRow.id,
          phone: cleanPhone,
          note: dbRow.note ?? cleanNote,
          source: "database",
          isRegistered: false,
          created_at: dbRow.created_at,
        }
      : {
          id: savedLocal.id,
          phone: cleanPhone,
          note: savedLocal.note ?? cleanNote,
          source: "local",
          isRegistered: false,
          created_at: savedLocal.created_at,
        };

    return NextResponse.json({
      success: true,
      message: dbSuccess
        ? `Phone number ${cleanPhone} is now authorized for administrator registration!`
        : `Phone number ${cleanPhone} authorized locally (create public.authorized_admin_phones in Supabase to sync across deployments).`,
      phone: cleanPhone,
      item,
      dbSynced: dbSuccess,
      tableExists,
      tableNotCreated: !tableExists,
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

    let body: { id?: unknown; phone?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { id, phone } = body;

    if (!id && !phone) {
      return NextResponse.json(
        { error: "Provide either phone ID or phone number to revoke." },
        { status: 400 }
      );
    }

    // 1. Delete from local storage (both memory and file)
    if (typeof phone === "string" && phone.trim()) {
      deleteLocalAuthorizedPhone(phone);
    }
    if (typeof id === "string" || typeof id === "number") {
      deleteLocalAuthorizedPhone(id);
    }

    // 2. Delete from Supabase public.authorized_admin_phones
    try {
      if (typeof id === "number") {
        await supabaseAdmin.from("authorized_admin_phones").delete().eq("id", id);
      } else if (typeof phone === "string" && phone.trim()) {
        const cleanPhone = normalizePhoneNumber(phone);
        const { data: rows } = await supabaseAdmin
          .from("authorized_admin_phones")
          .select("id, phone");

        if (Array.isArray(rows) && rows.length > 0) {
          const matchingIds = rows
            .filter((r: { id: number; phone: string }) => arePhonesEqual(r.phone, cleanPhone))
            .map((r: { id: number }) => r.id);

          if (matchingIds.length > 0) {
            await supabaseAdmin
              .from("authorized_admin_phones")
              .delete()
              .in("id", matchingIds);
          }
        }
      }
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

