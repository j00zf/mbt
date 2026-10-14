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

import {
  sanitizeText,
  sanitizePositiveInt,
  containsSqlInjection,
  validateWhitelist,
} from "@/lib/security";

const VALID_INTERNSHIP_STATUSES = ["active", "draft", "closed"] as const;
const VALID_WORKPLACE_TYPES = ["Remote", "Hybrid", "Onsite"] as const;
const VALID_INTERNSHIP_TYPES = ["Full-time", "Part-time"] as const;

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

    // Check for SQL injection attempts
    if (
      containsSqlInjection(title) ||
      containsSqlInjection(description) ||
      containsSqlInjection(requirements) ||
      containsSqlInjection(responsibilities) ||
      containsSqlInjection(target_audience) ||
      containsSqlInjection(project_focus)
    ) {
      return NextResponse.json(
        { error: "Suspicious characters or SQL syntax detected." },
        { status: 400 }
      );
    }

    const cleanTitle = sanitizeText(title, 200);
    const cleanSchoolCode = sanitizeText(school_code, 10).toUpperCase();
    const cleanDurationModel = sanitizeText(duration_model, 100);
    const cleanDescription = sanitizeText(description, 5000);

    const resolvedSchoolName =
      sanitizeText(school_name, 100) ||
      MBT_SCHOOLS.find((s) => s.code === cleanSchoolCode)?.name ||
      "General Discipline";

    const skillsArray = Array.isArray(skills)
      ? skills.map((s: unknown) => sanitizeText(s, 50)).filter(Boolean)
      : typeof skills === "string" && skills.trim()
      ? skills.split(",").map((s) => sanitizeText(s, 50)).filter(Boolean)
      : [];

    const formattedDeadline =
      deadline && String(deadline).trim()
        ? sanitizeText(String(deadline).trim().substring(0, 10), 10)
        : null;

    const payload = {
      title: cleanTitle,
      school_code: cleanSchoolCode,
      school_name: resolvedSchoolName,
      duration_model: cleanDurationModel,
      duration_hours_months: sanitizeText(duration_hours_months, 50) || "120 hrs",
      target_audience: target_audience ? sanitizeText(target_audience, 200) : null,
      project_focus: project_focus ? sanitizeText(project_focus, 200) : null,
      location: sanitizeText(location, 100) || "Remote",
      workplace_type: validateWhitelist(workplace_type, VALID_WORKPLACE_TYPES, "Remote"),
      internship_type: validateWhitelist(internship_type, VALID_INTERNSHIP_TYPES, "Full-time"),
      stipend: sanitizeText(stipend, 100) || "Unpaid",
      openings: sanitizePositiveInt(openings) || 1,
      description: cleanDescription,
      requirements: requirements ? sanitizeText(requirements, 3000) : null,
      responsibilities: responsibilities ? sanitizeText(responsibilities, 3000) : null,
      skills: skillsArray.length > 0 ? skillsArray : null,
      deadline: formattedDeadline,
      status: validateWhitelist(status, VALID_INTERNSHIP_STATUSES, "active"),
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

    const numericId = sanitizePositiveInt(id);
    if (!numericId) {
      return NextResponse.json({ error: "A valid numeric Internship ID is required." }, { status: 400 });
    }

    // Check for SQL injection in updated text fields
    if (
      (fields.title && containsSqlInjection(fields.title)) ||
      (fields.description && containsSqlInjection(fields.description)) ||
      (fields.requirements && containsSqlInjection(fields.requirements)) ||
      (fields.responsibilities && containsSqlInjection(fields.responsibilities))
    ) {
      return NextResponse.json({ error: "Suspicious characters or SQL syntax detected." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (fields.title !== undefined) updates.title = sanitizeText(fields.title, 200);
    if (fields.school_code !== undefined) updates.school_code = sanitizeText(fields.school_code, 10).toUpperCase();
    if (fields.school_name !== undefined) updates.school_name = sanitizeText(fields.school_name, 100);
    if (fields.duration_model !== undefined) updates.duration_model = sanitizeText(fields.duration_model, 100);
    if (fields.duration_hours_months !== undefined) updates.duration_hours_months = sanitizeText(fields.duration_hours_months, 50);
    if (fields.target_audience !== undefined) updates.target_audience = fields.target_audience ? sanitizeText(fields.target_audience, 200) : null;
    if (fields.project_focus !== undefined) updates.project_focus = fields.project_focus ? sanitizeText(fields.project_focus, 200) : null;
    if (fields.location !== undefined) updates.location = sanitizeText(fields.location, 100) || "Remote";
    if (fields.workplace_type !== undefined) updates.workplace_type = validateWhitelist(fields.workplace_type, VALID_WORKPLACE_TYPES, "Remote");
    if (fields.internship_type !== undefined) updates.internship_type = validateWhitelist(fields.internship_type, VALID_INTERNSHIP_TYPES, "Full-time");
    if (fields.stipend !== undefined) updates.stipend = sanitizeText(fields.stipend, 100) || "Unpaid";
    if (fields.openings !== undefined) updates.openings = sanitizePositiveInt(fields.openings) || 1;
    if (fields.description !== undefined) updates.description = sanitizeText(fields.description, 5000);
    if (fields.requirements !== undefined) updates.requirements = fields.requirements ? sanitizeText(fields.requirements, 3000) : null;
    if (fields.responsibilities !== undefined) updates.responsibilities = fields.responsibilities ? sanitizeText(fields.responsibilities, 3000) : null;
    if (fields.status !== undefined) updates.status = validateWhitelist(fields.status, VALID_INTERNSHIP_STATUSES, "active");

    if (fields.deadline !== undefined) {
      updates.deadline =
        fields.deadline && String(fields.deadline).trim()
          ? sanitizeText(String(fields.deadline).trim().substring(0, 10), 10)
          : null;
    }

    if (fields.skills !== undefined) {
      const skillsArray = Array.isArray(fields.skills)
        ? fields.skills.map((s: unknown) => sanitizeText(s, 50)).filter(Boolean)
        : typeof fields.skills === "string" && fields.skills.trim()
        ? fields.skills.split(",").map((s: string) => sanitizeText(s, 50)).filter(Boolean)
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

    const numericId = sanitizePositiveInt(id);
    if (!numericId) {
      return NextResponse.json({ error: "A valid numeric Internship ID is required." }, { status: 400 });
    }

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
