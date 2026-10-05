import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase, MBT_SCHOOLS, MBT_DURATION_MODELS } from "@/lib/supabase";
import {
  getLocalInternships,
  addLocalInternship,
  updateLocalInternship,
  deleteLocalInternship,
} from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get("active") === "true" || !session;

    // Try Supabase first
    let query = supabase.from("internships").select("*").order("created_at", { ascending: false });
    if (onlyActive) {
      query = query.eq("status", "active");
    }

    const { data: internships, error } = await query;

    if (error) {
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist")
      ) {
        let localList = getLocalInternships();
        if (onlyActive) {
          localList = localList.filter((i) => i.status === "active");
        }
        return NextResponse.json({
          internships: localList,
          tableNotCreated: true,
          message: "The internships table has not been created in Supabase yet. Using local dynamic store.",
        });
      }

      console.error("Supabase error fetching internships:", error);
      let localList = getLocalInternships();
      if (onlyActive) {
        localList = localList.filter((i) => i.status === "active");
      }
      return NextResponse.json({
        internships: localList,
        tableNotCreated: true,
        message: error.message,
      });
    }

    if (!internships || internships.length === 0) {
      let localList = getLocalInternships();
      if (onlyActive) {
        localList = localList.filter((i) => i.status === "active");
      }
      return NextResponse.json({ internships: localList, tableNotCreated: false });
    }

    return NextResponse.json({ internships, tableNotCreated: false });
  } catch (err: unknown) {
    console.error("GET /api/admin/internships error:", err);
    const localList = getLocalInternships();
    return NextResponse.json({ internships: localList, tableNotCreated: true });
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
      ? skills
      : typeof skills === "string" && skills.trim()
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      title: title.trim(),
      school_code: school_code.trim().toUpperCase(),
      school_name: resolvedSchoolName.trim(),
      duration_model: duration_model.trim(),
      duration_hours_months: duration_hours_months?.trim() || "120 hrs",
      target_audience: target_audience?.trim() || null,
      project_focus: project_focus?.trim() || null,
      location: location.trim(),
      workplace_type,
      internship_type,
      stipend: stipend.trim(),
      openings: parseInt(String(openings), 10) || 1,
      description: description.trim(),
      requirements: requirements?.trim() || null,
      responsibilities: responsibilities?.trim() || null,
      skills: skillsArray,
      deadline: deadline || null,
      status: status || "active",
      created_by: session.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newInternship, error } = await supabase
      .from("internships")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist")
      ) {
        const localSaved = addLocalInternship(payload);
        return NextResponse.json({
          success: true,
          message: "Internship created successfully (saved to local fallback store).",
          internship: localSaved,
          tableNotCreated: true,
        });
      }

      console.error("Supabase insert internship error:", error);
      const localSaved = addLocalInternship(payload);
      return NextResponse.json({
        success: true,
        message: "Internship created in fallback store.",
        internship: localSaved,
        tableNotCreated: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Internship created successfully!",
      internship: newInternship,
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
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Internship ID is required." }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fields.title !== undefined) updates.title = fields.title.trim();
    if (fields.school_code !== undefined) updates.school_code = fields.school_code.trim().toUpperCase();
    if (fields.school_name !== undefined) updates.school_name = fields.school_name.trim();
    if (fields.duration_model !== undefined) updates.duration_model = fields.duration_model.trim();
    if (fields.duration_hours_months !== undefined) updates.duration_hours_months = fields.duration_hours_months.trim();
    if (fields.target_audience !== undefined) updates.target_audience = fields.target_audience?.trim() || null;
    if (fields.project_focus !== undefined) updates.project_focus = fields.project_focus?.trim() || null;
    if (fields.location !== undefined) updates.location = fields.location.trim();
    if (fields.workplace_type !== undefined) updates.workplace_type = fields.workplace_type;
    if (fields.internship_type !== undefined) updates.internship_type = fields.internship_type;
    if (fields.stipend !== undefined) updates.stipend = fields.stipend.trim();
    if (fields.openings !== undefined) updates.openings = parseInt(String(fields.openings), 10) || 1;
    if (fields.description !== undefined) updates.description = fields.description.trim();
    if (fields.requirements !== undefined) updates.requirements = fields.requirements?.trim() || null;
    if (fields.responsibilities !== undefined) updates.responsibilities = fields.responsibilities?.trim() || null;
    if (fields.deadline !== undefined) updates.deadline = fields.deadline || null;
    if (fields.status !== undefined) updates.status = fields.status;

    if (fields.skills !== undefined) {
      updates.skills = Array.isArray(fields.skills)
        ? fields.skills
        : typeof fields.skills === "string" && fields.skills.trim()
        ? fields.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
    }

    const { data: updatedInternship, error } = await supabase
      .from("internships")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist")
      ) {
        const localUpdated = updateLocalInternship(Number(id), updates);
        return NextResponse.json({
          success: true,
          message: "Internship updated successfully (saved locally).",
          internship: localUpdated,
          tableNotCreated: true,
        });
      }

      console.error("Supabase update internship error:", error);
      const localUpdated = updateLocalInternship(Number(id), updates);
      return NextResponse.json({
        success: true,
        message: "Internship updated in fallback store.",
        internship: localUpdated,
        tableNotCreated: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Internship updated successfully!",
      internship: updatedInternship,
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
      return NextResponse.json({ error: "Internship ID is required." }, { status: 400 });
    }

    const numericId = Number(id);

    const { error } = await supabase.from("internships").delete().eq("id", numericId);

    if (error) {
      if (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist")
      ) {
        deleteLocalInternship(numericId);
        return NextResponse.json({
          success: true,
          message: "Internship deleted successfully from local store.",
        });
      }

      console.error("Supabase delete internship error:", error);
      deleteLocalInternship(numericId);
      return NextResponse.json({
        success: true,
        message: "Internship deleted from fallback store.",
      });
    }

    deleteLocalInternship(numericId);

    return NextResponse.json({
      success: true,
      message: "Internship deleted successfully!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
