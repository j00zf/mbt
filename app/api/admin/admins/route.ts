import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attempt to query with phone and status
    const { data: admins, error } = await supabase
      .from("admins")
      .select("id, name, email, phone, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST204" || error.message?.includes("phone") || error.message?.includes("status")) {
        // Fallback: try with status only
        const { data: statusAdmins, error: statusErr } = await supabase
          .from("admins")
          .select("id, name, email, status, created_at")
          .order("created_at", { ascending: false });

        if (!statusErr && statusAdmins) {
          const normalized = statusAdmins.map((a) => ({
            ...a,
            phone: null,
            status: a.status || "active",
          }));
          return NextResponse.json(
            { admins: normalized, phoneColumnMissing: true },
            { headers: { "Cache-Control": "no-store, max-age=0" } }
          );
        }

        // Fallback for legacy schema without status or phone column
        const { data: legacyAdmins, error: legacyErr } = await supabase
          .from("admins")
          .select("id, name, email, created_at")
          .order("created_at", { ascending: false });

        if (legacyErr) {
          console.error("Error fetching admins legacy:", legacyErr);
          return NextResponse.json({ error: legacyErr.message }, { status: 500 });
        }

        const normalized = (legacyAdmins || []).map((a) => ({
          ...a,
          phone: null,
          status: "active",
        }));
        return NextResponse.json(
          { admins: normalized, statusColumnMissing: true, phoneColumnMissing: true },
          { headers: { "Cache-Control": "no-store, max-age=0" } }
        );
      }

      console.error("Error fetching admins:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch admins" },
        { status: 500 }
      );
    }

    const normalized = (admins || []).map((a) => ({
      ...a,
      phone: (a as any).phone || null,
      status: a.status || "active",
    }));

    return NextResponse.json(
      { admins: normalized, statusColumnMissing: false, phoneColumnMissing: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { sanitizePositiveInt } from "@/lib/security";

export async function PATCH(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { adminId, status } = body;

    const numericTargetId = sanitizePositiveInt(adminId);
    if (!numericTargetId) {
      return NextResponse.json({ error: "A valid numeric Target Admin ID is required." }, { status: 400 });
    }

    // Constraint: "another admin can only toggle the status of admin"
    // An admin cannot modify their own status (prevents self-deactivation and ensures peer authorization)
    if (numericTargetId === Number(session.id)) {
      return NextResponse.json(
        { error: "You cannot change your own admin status. Another active administrator must toggle it." },
        { status: 403 }
      );
    }

    // Retrieve target admin's current status
    const { data: targetAdmin, error: findError } = await supabase
      .from("admins")
      .select("id, name, email, status")
      .eq("id", numericTargetId)
      .single();

    if (findError) {
      if (findError.code === "PGRST204" || findError.message?.includes("status")) {
        return NextResponse.json(
          {
            error:
              "The 'status' column has not been added to public.admins in Supabase yet. Please run the SQL migration: ALTER TABLE public.admins ADD COLUMN status text NOT NULL DEFAULT 'inactive';",
            migrationRequired: true,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Admin not found or database query failed." },
        { status: 404 }
      );
    }

    // Determine new status: if provided use it, otherwise toggle
    let newStatus: string;
    if (status && (status === "active" || status === "inactive")) {
      newStatus = status;
    } else {
      const current = (targetAdmin.status || "active").toLowerCase();
      newStatus = current === "active" ? "inactive" : "active";
    }

    // Update in Supabase
    const { data: updatedAdmin, error: updateError } = await supabaseAdmin
      .from("admins")
      .update({ status: newStatus })
      .eq("id", numericTargetId)
      .select("id, name, email, status, created_at")
      .single();

    if (updateError) {
      if (updateError.code === "PGRST204" || updateError.message?.includes("status")) {
        return NextResponse.json(
          {
            error:
              "The 'status' column has not been added to public.admins in Supabase yet. Please run: ALTER TABLE public.admins ADD COLUMN status text NOT NULL DEFAULT 'inactive';",
            migrationRequired: true,
          },
          { status: 400 }
        );
      }
      console.error("Update admin status error:", updateError);
      return NextResponse.json({ error: updateError.message || "Failed to update admin status." }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Admin ${targetAdmin.name}'s status was updated to ${newStatus}.`,
        admin: updatedAdmin,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/admins
 * Permanently removes an administrator account.
 * Requires logged in admin session and enforces peer protection (cannot delete self).
 */
export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { adminId } = body;

    const numericTargetId = sanitizePositiveInt(adminId);
    if (!numericTargetId) {
      return NextResponse.json(
        { error: "A valid numeric Administrator ID is required." },
        { status: 400 }
      );
    }

    // Constraint: You cannot delete your own account (peer protection)
    if (numericTargetId === Number(session.id)) {
      return NextResponse.json(
        { error: "You cannot remove your own administrator account. Another active administrator must perform this action." },
        { status: 403 }
      );
    }

    // Retrieve target admin to check existence
    const { data: targetAdmin, error: findError } = await supabaseAdmin
      .from("admins")
      .select("id, name, email")
      .eq("id", numericTargetId)
      .single();

    if (findError || !targetAdmin) {
      // Fallback try with anon client
      const { data: anonTarget } = await supabase
        .from("admins")
        .select("id, name, email")
        .eq("id", numericTargetId)
        .single();

      if (!anonTarget) {
        return NextResponse.json(
          { error: "Administrator account not found or already deleted." },
          { status: 404 }
        );
      }
    }

    const adminName = targetAdmin?.name || `Admin #${numericTargetId}`;

    // Execute deletion from public.admins
    const { error: deleteError } = await supabaseAdmin
      .from("admins")
      .delete()
      .eq("id", numericTargetId);

    if (deleteError) {
      // Fallback attempt
      const { error: fallbackErr } = await supabase
        .from("admins")
        .delete()
        .eq("id", numericTargetId);

      if (fallbackErr) {
        console.error("Failed to delete admin:", deleteError, fallbackErr);
        return NextResponse.json(
          { error: deleteError.message || fallbackErr.message || "Failed to remove administrator account." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Administrator "${adminName}" has been successfully removed.`,
      deletedId: numericTargetId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

