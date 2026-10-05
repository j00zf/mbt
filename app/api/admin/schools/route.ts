import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase, DEFAULT_MBT_SCHOOLS, ProgrammeSchool } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: schools, error } = await supabase
      .from("programme_schools")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      // Table doesn't exist yet in Supabase - return fallback list with indicator
      if (error.code === "PGRST205" || error.code === "42P01") {
        const fallbackSchools: ProgrammeSchool[] = DEFAULT_MBT_SCHOOLS.map((s, idx) => ({
          ...s,
          id: idx + 1,
          created_at: new Date().toISOString(),
        }));
        return NextResponse.json({
          schools: fallbackSchools,
          tableNotCreated: true,
          message: "The programme_schools table has not been created in Supabase yet.",
        });
      }

      console.error("Error fetching schools:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch schools" },
        { status: 500 }
      );
    }

    // If table exists but is empty, seed or return empty
    return NextResponse.json({ schools: schools || [], tableNotCreated: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newSchool, error } = await supabase
      .from("programme_schools")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert school error:", error);
      if (error.code === "PGRST205" || error.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "The programme_schools table does not exist in Supabase yet. Run the SQL schema first.",
            tableNotCreated: true,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to add school" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "School created successfully!",
      school: newSchool,
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

    const { data: updatedSchool, error } = await supabase
      .from("programme_schools")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase update school error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update school" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "School updated successfully!",
      school: updatedSchool,
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

    const { error } = await supabase.from("programme_schools").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete school error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete school" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "School deleted successfully!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
