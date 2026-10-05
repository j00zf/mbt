import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase, MBT_SCHOOLS, MBT_DURATION_MODELS } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: internships, error } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        return NextResponse.json({
          internships: [],
          tableNotCreated: true,
          message: "The internships table has not been created in Supabase yet.",
        });
      }

      console.error("Supabase error fetching internships:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch internships", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ internships: internships || [], tableNotCreated: false });
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
      requirements = "",
      responsibilities = "",
      skills = [],
      deadline = null,
      status = "active",
    } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Role Title and Description are required." },
        { status: 400 }
      );
    }

    // Resolve School if missing
    let resolvedSchoolName = school_name;
    if (!resolvedSchoolName && school_code) {
      const match = MBT_SCHOOLS.find((s) => s.code === school_code);
      if (match) resolvedSchoolName = match.name;
    }
    if (!resolvedSchoolName) {
      resolvedSchoolName = "Technology & Digital Innovation";
    }

    // Resolve Model if missing
    let resolvedDuration = duration_hours_months;
    let resolvedAudience = target_audience;
    let resolvedFocus = project_focus;
    if (duration_model) {
      const modelMatch = MBT_DURATION_MODELS.find(
        (m) => `${m.model} - ${m.title}` === duration_model || m.model === duration_model
      );
      if (modelMatch) {
        if (!resolvedDuration) resolvedDuration = modelMatch.duration;
        if (!resolvedAudience) resolvedAudience = modelMatch.suitableFor;
        if (!resolvedFocus) resolvedFocus = modelMatch.focus;
      }
    }

    const payload = {
      title: title.trim(),
      school_code: school_code || "A",
      school_name: resolvedSchoolName,
      duration_model: duration_model || "Model A - Foundation",
      duration_hours_months: resolvedDuration || "40–80 hrs",
      target_audience: resolvedAudience || null,
      project_focus: resolvedFocus || null,
      location: (location || "Remote").trim(),
      workplace_type,
      internship_type,
      stipend: (stipend || "Unpaid").trim(),
      openings: Number(openings) || 1,
      description: description.trim(),
      requirements: requirements?.trim() || null,
      responsibilities: responsibilities?.trim() || null,
      skills: Array.isArray(skills)
        ? skills
        : typeof skills === "string"
        ? skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
      deadline: deadline || null,
      status,
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
      console.error("Supabase insert internship error:", error);
      if (error.code === "PGRST205" || error.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "The internships table does not exist in your Supabase database yet. Please run the SQL schema in your Supabase SQL editor.",
            tableNotCreated: true,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to create internship", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Internship created successfully!",
      internship: newInternship,
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Internship ID is required." }, { status: 400 });
    }

    const cleanUpdates = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (typeof cleanUpdates.skills === "string") {
      cleanUpdates.skills = cleanUpdates.skills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    const { data: updatedInternship, error } = await supabase
      .from("internships")
      .update(cleanUpdates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase update internship error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update internship" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Internship updated successfully!",
      internship: updatedInternship,
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

    const { error } = await supabase.from("internships").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete internship error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete internship" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Internship deleted successfully!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
