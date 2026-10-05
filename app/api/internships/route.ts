import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getLocalInternships } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const school = searchParams.get("school");
    const track = searchParams.get("track");

    let query = supabase.from("internships").select("*").eq("status", "active").order("created_at", { ascending: false });

    if (school && school !== "all") {
      query = query.eq("school_code", school.toUpperCase());
    }

    const { data: internships, error } = await query;

    if (error) {
      // Fallback
      let localList = getLocalInternships().filter((i) => i.status === "active");
      if (school && school !== "all") {
        localList = localList.filter((i) => i.school_code === school.toUpperCase());
      }
      return NextResponse.json({ internships: localList });
    }

    if (!internships || internships.length === 0) {
      let localList = getLocalInternships().filter((i) => i.status === "active");
      if (school && school !== "all") {
        localList = localList.filter((i) => i.school_code === school.toUpperCase());
      }
      return NextResponse.json({ internships: localList });
    }

    return NextResponse.json({ internships });
  } catch (err: unknown) {
    console.error("GET /api/internships error:", err);
    const localList = getLocalInternships().filter((i) => i.status === "active");
    return NextResponse.json({ internships: localList });
  }
}
