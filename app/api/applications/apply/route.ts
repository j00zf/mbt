import { NextResponse } from "next/server";
import { supabase, MBT_SCHOOLS } from "@/lib/supabase";
import { sendApplicationConfirmationEmail } from "@/lib/mailer";
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizePositiveInt,
  containsSqlInjection,
} from "@/lib/security";

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

    // Detect potential SQL injection payload in inputs
    if (
      containsSqlInjection(full_name) ||
      containsSqlInjection(email) ||
      containsSqlInjection(phone) ||
      containsSqlInjection(college) ||
      containsSqlInjection(degree) ||
      containsSqlInjection(statement_of_purpose)
    ) {
      return NextResponse.json(
        { error: "Suspicious characters or SQL syntax detected in application input." },
        { status: 400 }
      );
    }

    // Sanitize and validate Name
    const cleanFullName = sanitizeText(full_name, 100);
    if (!cleanFullName || cleanFullName.length < 2) {
      return NextResponse.json({ error: "Please enter your valid full name." }, { status: 400 });
    }

    // Sanitize and validate Email
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Sanitize and validate Phone
    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone) {
      return NextResponse.json(
        { error: "Please enter a valid contact phone number (7-20 digits)." },
        { status: 400 }
      );
    }

    // Sanitize academic fields
    const cleanCollege = sanitizeText(college, 150);
    if (!cleanCollege || cleanCollege.length < 2) {
      return NextResponse.json({ error: "Please enter your college or university name." }, { status: 400 });
    }

    const cleanDegree = sanitizeText(degree, 100);
    if (!cleanDegree || cleanDegree.length < 2) {
      return NextResponse.json({ error: "Please enter your degree or course of study." }, { status: 400 });
    }

    const cleanYear = sanitizeText(year_of_study, 50) || "Final Year";
    const cleanSop = sanitizeText(statement_of_purpose, 3000);

    // Validate URLs to eliminate XSS (reject javascript:, data:, etc.)
    let cleanResumeUrl: string | null = null;
    if (resume_url && typeof resume_url === "string" && resume_url.trim()) {
      cleanResumeUrl = sanitizeUrl(resume_url);
      if (!cleanResumeUrl) {
        return NextResponse.json(
          { error: "Resume URL must be a valid web link starting with http:// or https://" },
          { status: 400 }
        );
      }
    }

    let cleanLinkedinUrl: string | null = null;
    if (linkedin_url && typeof linkedin_url === "string" && linkedin_url.trim()) {
      cleanLinkedinUrl = sanitizeUrl(linkedin_url);
      if (!cleanLinkedinUrl) {
        return NextResponse.json(
          { error: "LinkedIn URL must be a valid web link starting with http:// or https://" },
          { status: 400 }
        );
      }
    }

    const cleanSchoolCode = sanitizeText(school_code, 10).toUpperCase() || "A";

    // Resolve school name safely
    let resolvedSchoolName = sanitizeText(school_name, 100);
    if (!resolvedSchoolName && cleanSchoolCode) {
      const match = MBT_SCHOOLS.find((s) => s.code === cleanSchoolCode);
      if (match) resolvedSchoolName = match.name;
    }
    if (!resolvedSchoolName) {
      resolvedSchoolName = "General / Multi-Disciplinary";
    }

    const cleanDurationModel = sanitizeText(duration_model, 100) || "Model B - Standard";
    const cleanInternshipId = sanitizePositiveInt(internship_id);

    // Attempt to resolve role title if not passed
    let resolvedRoleTitle = role_title ? sanitizeText(role_title, 150) : null;
    if (!resolvedRoleTitle && cleanInternshipId) {
      try {
        const { data: roleData } = await supabase
          .from("internships")
          .select("title")
          .eq("id", cleanInternshipId)
          .maybeSingle();
        if (roleData?.title) {
          resolvedRoleTitle = sanitizeText(roleData.title, 150);
        }
      } catch (err) {
        console.warn("Could not fetch internship title for email:", err);
      }
    }

    const payload = {
      internship_id: cleanInternshipId,
      full_name: cleanFullName,
      email: cleanEmail,
      phone: cleanPhone,
      college: cleanCollege,
      degree: cleanDegree,
      year_of_study: cleanYear,
      school_code: cleanSchoolCode,
      school_name: resolvedSchoolName,
      duration_model: cleanDurationModel,
      resume_url: cleanResumeUrl,
      linkedin_url: cleanLinkedinUrl,
      statement_of_purpose: cleanSop || null,
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
