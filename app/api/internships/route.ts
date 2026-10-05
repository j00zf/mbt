import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getLocalInternships } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const school = searchParams.get("school");
    const track = searchParams.get("track");

    let query = supabaseAdmin
      .from("internships")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (school && school !== "all") {
      query = query.eq("school_code", school.toUpperCase());
    }

    if (track && track !== "all") {
      query = query.ilike("duration_model", `${track}%`);
    }

    const { data: internships, error } = await query;

    const filterLocal = () => {
      let list = getLocalInternships().filter((i) => i.status === "active");
      if (school && school !== "all") {
        list = list.filter((i) => i.school_code === school.toUpperCase());
      }
      if (track && track !== "all") {
        list = list.filter((i) => i.duration_model?.toLowerCase().startsWith(track.toLowerCase()));
      }
      return list;
    };

    if (error || !internships || internships.length === 0) {
      return NextResponse.json({ internships: filterLocal() });
    }

    return NextResponse.json({ internships });
  } catch (err: unknown) {
    console.error("GET /api/internships error:", err);
    return NextResponse.json({ internships: getLocalInternships().filter((i) => i.status === "active") });
  }
}
