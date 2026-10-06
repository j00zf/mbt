import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabaseAdmin, MBT_SCHOOLS, type Internship } from "@/lib/supabase";
import {
  getLocalInternships,
  addLocalInternship,
  updateLocalInternship,
  deleteLocalInternship,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get("active") === "true" || !session;

    // Try Supabase first
    let query = supabaseAdmin.from("internships").select("*").order("created_at", { ascending: false });
    if (onlyActive) {
      query = query.eq("status", "active");
    }

    const { data: internships, error } = await query;

    if (error) {
      const isTableMissing =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist");

      console.warn("Supabase error fetching internships, falling back to local store:", error);
      let localList = getLocalInternships();
      if (onlyActive) {
        localList = localList.filter((i) => i.status === "active");
      }
      return NextResponse.json(
        {
          internships: localList,
          tableNotCreated: isTableMissing,
          message: error.message,
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    // Return the actual database records (even if empty, do NOT re-seed mock data)
    return NextResponse.json(
      { internships: internships || [], tableNotCreated: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    console.error("GET /api/admin/internships error:", err);
    const localList = getLocalInternships();
    return NextResponse.json(
      { internships: localList, tableNotCreated: true },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      school_code,
      school_name,
      duration_model,
      duration_hours_months,
      target_audience,
      project_focus,
      location = "Remote",
      workplace_type = "Remote",
      internship_type = "Full-time",
      stipend = "Unpaid",
      openings = 1,
      description,
      requirements,
      responsibilities,
      skills,
      deadline,
      status = "active",
    } = body;

    if (!title || !description || !school_code || !duration_model) {
      return NextResponse.json(
        { error: "Title, description, school, and duration model are required fields." },
        { status: 400 }
      );
    }

    const resolvedSchoolName =
      school_name ||
      MBT_SCHOOLS.find((s) => s.code === school_code)?.name ||
      "General Discipline";

    const skillsArray = Array.isArray(skills)
      ? skills.map((s: unknown) => String(s).trim()).filter(Boolean)
      : typeof skills === "string" && skills.trim()
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const formattedDeadline =
      deadline && String(deadline).trim()
        ? String(deadline).trim().substring(0, 10)
        : null;

    const payload = {
      title: title.trim(),
      school_code: school_code.trim().toUpperCase(),
      school_name: resolvedSchoolName.trim(),
      duration_model: duration_model.trim(),
      duration_hours_months: duration_hours_months?.trim() || "120 hrs",
      target_audience: target_audience?.trim() || null,
      project_focus: project_focus?.trim() || null,
      location: location?.trim() || "Remote",
      workplace_type: workplace_type || "Remote",
      internship_type: internship_type || "Full-time",
      stipend: stipend?.trim() || "Unpaid",
      openings: parseInt(String(openings), 10) || 1,
      description: description.trim(),
      requirements: requirements?.trim() || null,
      responsibilities: responsibilities?.trim() || null,
      skills: skillsArray.length > 0 ? skillsArray : null,
      deadline: formattedDeadline,
      status: status || "active",
      created_by: session.id ? Number(session.id) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newInternship, error } = await supabaseAdmin
      .from("internships")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.warn("Supabase insert internship error, using fallback store:", error);
      const localSaved = addLocalInternship(payload as Omit<Internship, "id">);
      const isTableMissing =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist");
      return NextResponse.json(
        {
          success: true,
          message: isTableMissing
            ? "Internship created in fallback store (Supabase table not found)."
            : "Internship created in fallback store.",
          internship: localSaved,
          tableNotCreated: isTableMissing,
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    addLocalInternship({ ...(newInternship || payload) } as Omit<Internship, "id">);
    return NextResponse.json(
      {
        success: true,
        message: "Internship created successfully!",
        internship: newInternship,
        tableNotCreated: false,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
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
    const { id, ...fields } = body;

    if (!id && id !== 0) {
      return NextResponse.json({ error: "Internship ID is required." }, { status: 400 });
    }

    const numericId = Number(id);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (fields.title !== undefined) updates.title = fields.title.trim();
    if (fields.school_code !== undefined) updates.school_code = fields.school_code.trim().toUpperCase();
    if (fields.school_name !== undefined) updates.school_name = fields.school_name.trim();
    if (fields.duration_model !== undefined) updates.duration_model = fields.duration_model.trim();
    if (fields.duration_hours_months !== undefined) updates.duration_hours_months = fields.duration_hours_months.trim();
    if (fields.target_audience !== undefined) updates.target_audience = fields.target_audience?.trim() || null;
    if (fields.project_focus !== undefined) updates.project_focus = fields.project_focus?.trim() || null;
    if (fields.location !== undefined) updates.location = fields.location?.trim() || "Remote";
    if (fields.workplace_type !== undefined) updates.workplace_type = fields.workplace_type;
    if (fields.internship_type !== undefined) updates.internship_type = fields.internship_type;
    if (fields.stipend !== undefined) updates.stipend = fields.stipend?.trim() || "Unpaid";
    if (fields.openings !== undefined) updates.openings = parseInt(String(fields.openings), 10) || 1;
    if (fields.description !== undefined) updates.description = fields.description.trim();
    if (fields.requirements !== undefined) updates.requirements = fields.requirements?.trim() || null;
    if (fields.responsibilities !== undefined) updates.responsibilities = fields.responsibilities?.trim() || null;
    if (fields.status !== undefined) updates.status = fields.status;

    if (fields.deadline !== undefined) {
      updates.deadline =
        fields.deadline && String(fields.deadline).trim()
          ? String(fields.deadline).trim().substring(0, 10)
          : null;
    }

    if (fields.skills !== undefined) {
      const skillsArray = Array.isArray(fields.skills)
        ? fields.skills.map((s: unknown) => String(s).trim()).filter(Boolean)
        : typeof fields.skills === "string" && fields.skills.trim()
        ? fields.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      updates.skills = skillsArray.length > 0 ? skillsArray : null;
    }

    // Try Supabase update
    const { data: updatedInternship, error } = await supabaseAdmin
      .from("internships")
      .update(updates)
      .eq("id", numericId)
      .select("*")
      .single();

    if (error) {
      const isTableMissing =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist");

      console.warn("Supabase update internship error, saving to local store:", error);
      const localUpdated = updateLocalInternship(numericId, updates);
      return NextResponse.json(
        {
          success: true,
          message: isTableMissing
            ? "Internship updated in fallback store (Supabase table not found)."
            : "Internship updated in fallback store.",
          internship: localUpdated,
          tableNotCreated: isTableMissing,
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    updateLocalInternship(numericId, updates);

    return NextResponse.json(
      {
        success: true,
        message: "Internship updated successfully!",
        internship: updatedInternship,
        tableNotCreated: false,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
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

    if (!id && id !== "0") {
      return NextResponse.json({ error: "Internship ID is required." }, { status: 400 });
    }

    const numericId = Number(id);

    const { error } = await supabaseAdmin.from("internships").delete().eq("id", numericId);

    if (error) {
      console.warn("Supabase delete internship error:", error);
    }

    deleteLocalInternship(numericId);

    return NextResponse.json(
      {
        success: true,
        message: "Internship deleted successfully!",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
