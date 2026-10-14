import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  normalizePhoneNumber,
  sanitizeText,
  containsSqlInjection,
  arePhonesEqual,
} from "@/lib/security";

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

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "authorized_admin_phones.json");

function readLocalAuthorizedPhones(): { id: string; phone: string; note: string | null; created_at: string }[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalAuthorizedPhones(list: { id: string; phone: string; note: string | null; created_at: string }[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write authorized phones to disk:", err);
  }
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

    // 1. Get existing registered admins to determine registration status
    let registeredAdmins: { id: number; name: string; email: string; phone?: string | null }[] = [];
    try {
      const { data: adminData } = await supabaseAdmin
        .from("admins")
        .select("id, name, email, phone");
      if (adminData) {
        registeredAdmins = adminData;
      }
    } catch {
      // Ignore if column not found
    }

    // 2. Query Supabase table: authorized_admin_phones
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

    // 3. Query local persistent storage
    const localPhones = readLocalAuthorizedPhones();

    // 4. Load environment-authorized phones
    const envPhonesStr = process.env.AUTHORIZED_ADMIN_PHONES || "9876543210,+919876543210";
    const envPhoneList = envPhonesStr
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (!envPhoneList.some((p) => arePhonesEqual(p, "9876543210"))) {
      envPhoneList.push("9876543210");
    }

    // Combine and format the list
    const combined: AuthorizedPhoneItem[] = [];

    // Add database phones
    for (const item of dbPhones) {
      const matchedAdmin = registeredAdmins.find(
        (a) => a.phone && arePhonesEqual(a.phone, item.phone)
      );

      combined.push({
        id: item.id,
        phone: item.phone,
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
      const alreadyPresent = combined.some((c) => arePhonesEqual(c.phone, item.phone));
      if (!alreadyPresent) {
        const matchedAdmin = registeredAdmins.find(
          (a) => a.phone && arePhonesEqual(a.phone, item.phone)
        );

        combined.push({
          id: item.id,
          phone: item.phone,
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

    return NextResponse.json(
      {
        phones: combined,
        tableExists,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
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
    const nowIso = new Date().toISOString();

    // 1. Save to local persistent storage immediately
    const localList = readLocalAuthorizedPhones();
    const alreadyLocal = localList.some((p) => arePhonesEqual(p.phone, cleanPhone));
    if (!alreadyLocal) {
      localList.unshift({
        id: `local-${Date.now()}`,
        phone: cleanPhone,
        note: cleanNote,
        created_at: nowIso,
      });
      writeLocalAuthorizedPhones(localList);
    }

    // 2. Also attempt to save to Supabase public.authorized_admin_phones
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

    return NextResponse.json({
      success: true,
      message: `Phone number ${cleanPhone} is now authorized for administrator registration!`,
      phone: cleanPhone,
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

    // 1. Delete from local storage
    if (phone) {
      const cleanPhone = normalizePhoneNumber(phone);
      const localList = readLocalAuthorizedPhones();
      const filtered = localList.filter((p) => !arePhonesEqual(p.phone, cleanPhone));
      writeLocalAuthorizedPhones(filtered);
    } else if (id && typeof id === "string" && id.startsWith("local-")) {
      const localList = readLocalAuthorizedPhones();
      const filtered = localList.filter((p) => p.id !== id);
      writeLocalAuthorizedPhones(filtered);
    }

    // 2. Delete from Supabase
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
