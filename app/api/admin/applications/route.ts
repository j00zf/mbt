import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  sendApplicationShortlistedEmail,
  sendApplicationAcceptedEmail,
} from "@/lib/mailer";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: applications, error } = await supabaseAdmin
      .from("internship_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return NextResponse.json({
          applications: [],
          tableNotCreated: true,
          message: "The internship_applications table has not been created in Supabase yet.",
        });
      }

      console.error("Error fetching applications:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch student applications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      applications: applications || [],
      tableNotCreated: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const { data: updatedApp, error } = await supabaseAdmin
      .from("internship_applications")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating application:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update application" },
        { status: 500 }
      );
    }

    // Trigger email notification if student is shortlisted or accepted/selected
    let emailStatus: { sent: boolean; message?: string } | null = null;
    if (updatedApp && updatedApp.email) {
      const normalizedStatus = (status || "").toLowerCase();
      if (normalizedStatus === "shortlisted") {
        try {
          const mailRes = await sendApplicationShortlistedEmail({
            to: updatedApp.email,
            fullName: updatedApp.full_name,
            applicationId: updatedApp.id,
            schoolCode: updatedApp.school_code,
            schoolName: updatedApp.school_name,
            durationModel: updatedApp.duration_model,
            notes: updatedApp.notes,
          });
          emailStatus = {
            sent: mailRes.success,
            message: mailRes.success
              ? `Notification email sent to ${updatedApp.email}`
              : mailRes.error,
          };
        } catch (mailErr) {
          console.error("Failed to send shortlist email:", mailErr);
          emailStatus = { sent: false, message: "Email delivery failed" };
        }
      } else if (normalizedStatus === "accepted" || normalizedStatus === "selected") {
        try {
          const mailRes = await sendApplicationAcceptedEmail({
            to: updatedApp.email,
            fullName: updatedApp.full_name,
            applicationId: updatedApp.id,
            schoolCode: updatedApp.school_code,
            schoolName: updatedApp.school_name,
            durationModel: updatedApp.duration_model,
            notes: updatedApp.notes,
          });
          emailStatus = {
            sent: mailRes.success,
            message: mailRes.success
              ? `Selection offer email sent to ${updatedApp.email}`
              : mailRes.error,
          };
        } catch (mailErr) {
          console.error("Failed to send acceptance email:", mailErr);
          emailStatus = { sent: false, message: "Email delivery failed" };
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: emailStatus?.sent
        ? `Application updated to ${status} and email sent to ${updatedApp.email}!`
        : `Application status updated to ${status}.`,
      application: updatedApp,
      emailStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("internship_applications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting application:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete application" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
