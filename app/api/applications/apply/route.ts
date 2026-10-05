import { NextResponse } from "next/server";
import { supabase, MBT_SCHOOLS } from "@/lib/supabase";
import { sendApplicationConfirmationEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      internship_id = null,
      role_title = null,
      full_name,
      email,
      phone,
      college,
      degree,
      year_of_study = "Final Year",
      school_code,
      school_name,
      duration_model,
      resume_url = "",
      linkedin_url = "",
      statement_of_purpose = "",
    } = body;

    // Field validations
    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Please enter your contact phone number." }, { status: 400 });
    }
    if (!college?.trim()) {
      return NextResponse.json({ error: "Please enter your college or university name." }, { status: 400 });
    }
    if (!degree?.trim()) {
      return NextResponse.json({ error: "Please enter your degree or course of study." }, { status: 400 });
    }

    // Resolve school name
    let resolvedSchoolName = school_name;
    if (!resolvedSchoolName && school_code) {
      const match = MBT_SCHOOLS.find((s) => s.code === school_code);
      if (match) resolvedSchoolName = match.name;
    }
    if (!resolvedSchoolName) {
      resolvedSchoolName = "General / Multi-Disciplinary";
    }

    // Attempt to resolve role title if not passed
    let resolvedRoleTitle = role_title;
    if (!resolvedRoleTitle && internship_id) {
      try {
        const { data: roleData } = await supabase
          .from("internships")
          .select("title")
          .eq("id", Number(internship_id))
          .maybeSingle();
        if (roleData?.title) {
          resolvedRoleTitle = roleData.title;
        }
      } catch (err) {
        console.warn("Could not fetch internship title for email:", err);
      }
    }

    const payload = {
      internship_id: internship_id ? Number(internship_id) : null,
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      college: college.trim(),
      degree: degree.trim(),
      year_of_study: year_of_study.trim(),
      school_code: (school_code || "A").trim().toUpperCase(),
      school_name: resolvedSchoolName,
      duration_model: duration_model || "Model B - Standard",
      resume_url: resume_url?.trim() || null,
      linkedin_url: linkedin_url?.trim() || null,
      statement_of_purpose: statement_of_purpose?.trim() || null,
      status: "pending",
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("internship_applications")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase student application error:", error);
      if (error.code === "PGRST205" || error.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "The applications table has not been created in Supabase yet. Please run the provided SQL script in the Admin SQL editor.",
            tableNotCreated: true,
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to submit application", details: error },
        { status: 500 }
      );
    }

    // Trigger confirmation email using Gmail Nodemailer
    let emailResult: { success: boolean; error?: string; messageId?: string } = {
      success: false,
      error: "Not sent",
    };
    try {
      emailResult = await sendApplicationConfirmationEmail({
        to: payload.email,
        fullName: payload.full_name,
        applicationId: data.id,
        schoolCode: payload.school_code,
        schoolName: payload.school_name,
        durationModel: payload.duration_model,
        roleTitle: resolvedRoleTitle,
        college: payload.college,
        degree: payload.degree,
      });
    } catch (mailErr) {
      console.error("Error triggering application confirmation email:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully! Confirmation email has been sent.",
      applicationId: data.id,
      application: data,
      emailSent: emailResult.success,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
