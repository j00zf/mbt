import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: applications, error } = await supabase
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

    const { data: updatedApp, error } = await supabase
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

    return NextResponse.json({
      success: true,
      message: "Application status updated successfully!",
      application: updatedApp,
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

    const { error } = await supabase
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
