import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getLocalInternships } from "@/lib/storage";
import { sanitizePostgrestFilter } from "@/lib/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSchool = searchParams.get("school");
    const rawTrack = searchParams.get("track");

    const school =
      rawSchool && rawSchool !== "all"
        ? sanitizePostgrestFilter(rawSchool).toUpperCase()
        : null;
    const track =
      rawTrack && rawTrack !== "all"
        ? sanitizePostgrestFilter(rawTrack)
        : null;

    let query = supabaseAdmin
      .from("internships")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (school && /^[A-Z0-9_-]{1,10}$/.test(school)) {
      query = query.eq("school_code", school);
    }

    if (track && track.length <= 50) {
      query = query.ilike("duration_model", `${track}%`);
    }

    const { data: internships, error } = await query;

    if (error) {
      console.warn("Public internships query error, falling back to local store:", error);
      let list = getLocalInternships().filter((i) => i.status === "active");
      if (school && /^[A-Z0-9_-]{1,10}$/.test(school)) {
        list = list.filter((i) => i.school_code === school);
      }
      if (track && track.length <= 50) {
        list = list.filter((i) => i.duration_model?.toLowerCase().startsWith(track.toLowerCase()));
      }
      return NextResponse.json(
        { internships: list },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    return NextResponse.json(
      { internships: internships || [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: unknown) {
    console.error("GET /api/internships error:", err);
    return NextResponse.json(
      { internships: getLocalInternships().filter((i) => i.status === "active") },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
