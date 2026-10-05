import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase, ProgrammeSchool } from "@/lib/supabase";
import {
  getLocalSchools,
  addLocalSchool,
  updateLocalSchool,
  deleteLocalSchool,
} from "@/lib/storage";

export async function GET(request: Request) {
  try {
    // Attempt to query Supabase
    const { data: schools, error } = await supabase
      .from("programme_schools")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      // Table doesn't exist yet in Supabase (PGRST205 / 42P01) or other schema error
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist")) {
        const localList = getLocalSchools();
        return NextResponse.json({
          schools: localList,
          tableNotCreated: true,
          message: "The programme_schools table has not been created in Supabase yet. Using local dynamic store.",
        });
      }

      console.warn("Supabase fetch schools error, falling back to local store:", error);
      const localList = getLocalSchools();
      return NextResponse.json({
        schools: localList,
        tableNotCreated: true,
        message: error.message,
      });
    }

    if (!schools || schools.length === 0) {
      // If table exists but has no rows yet, return local seed
      const localList = getLocalSchools();
      return NextResponse.json({
        schools: localList,
        tableNotCreated: false,
      });
    }

    return NextResponse.json({ schools, tableNotCreated: false });
  } catch (err: unknown) {
    console.error("GET /api/admin/schools error:", err);
    const localList = getLocalSchools();
    return NextResponse.json({ schools: localList, tableNotCreated: true });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, description = "", sort_order = 0, is_active = true } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "School code (e.g. 'A') and name are required." },
        { status: 400 }
      );
    }

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description?.trim() || null,
      sort_order: Number(sort_order) || 0,
      is_active: Boolean(is_active),
    };

    // Try Supabase first
    const { data: newSchool, error } = await supabase
      .from("programme_schools")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      // If table does not exist, persist into local dynamic store seamlessly
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist")) {
        const localSaved = addLocalSchool(payload);
        return NextResponse.json({
          success: true,
          school: localSaved,
          tableNotCreated: true,
          message: "School created successfully! (Saved to local store. Run the SQL schema to sync to Supabase).",
        });
      }

      console.error("Supabase insert school error:", error);
      // Fallback
      const localSaved = addLocalSchool(payload);
      return NextResponse.json({
        success: true,
        school: localSaved,
        tableNotCreated: true,
        message: "School created successfully in fallback store.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "School created successfully!",
      school: newSchool,
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
    const { id, code, name, description, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "School ID is required." }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (sort_order !== undefined) updates.sort_order = Number(sort_order);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    // Try Supabase first
    const { data: updatedSchool, error } = await supabase
      .from("programme_schools")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist")) {
        const localUpdated = updateLocalSchool(Number(id), updates);
        return NextResponse.json({
          success: true,
          school: localUpdated,
          tableNotCreated: true,
          message: "School updated successfully (saved locally).",
        });
      }

      console.error("Supabase update school error:", error);
      const localUpdated = updateLocalSchool(Number(id), updates);
      return NextResponse.json({
        success: true,
        school: localUpdated,
        tableNotCreated: true,
        message: "School updated in fallback store.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "School updated successfully!",
      school: updatedSchool,
      tableNotCreated: false,
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
      return NextResponse.json({ error: "School ID is required." }, { status: 400 });
    }

    const numericId = Number(id);

    // Try Supabase first
    const { error } = await supabase.from("programme_schools").delete().eq("id", numericId);

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist")) {
        deleteLocalSchool(numericId);
        return NextResponse.json({
          success: true,
          tableNotCreated: true,
          message: "School deleted successfully from local store.",
        });
      }

      console.error("Supabase delete school error:", error);
      deleteLocalSchool(numericId);
      return NextResponse.json({
        success: true,
        tableNotCreated: true,
        message: "School deleted from fallback store.",
      });
    }

    // Also delete from local if it exists
    deleteLocalSchool(numericId);

    return NextResponse.json({
      success: true,
      message: "School deleted successfully!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
