import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase, DEFAULT_DURATION_MODELS, DurationModel } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: tracks, error } = await supabase
      .from("duration_models")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        const fallbackTracks: DurationModel[] = DEFAULT_DURATION_MODELS.map((m, idx) => ({
          ...m,
          id: idx + 1,
          created_at: new Date().toISOString(),
        }));
        return NextResponse.json({
          tracks: fallbackTracks,
          tableNotCreated: true,
          message: "The duration_models table has not been created in Supabase yet.",
        });
      }

      console.error("Error fetching duration models:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch tracks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracks: tracks || [], tableNotCreated: false });
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
      model_code,
      title,
      duration,
      suitable_for,
      focus,
      sort_order = 0,
      is_active = true,
    } = body;

    if (!model_code?.trim() || !title?.trim() || !duration?.trim()) {
      return NextResponse.json(
        { error: "Model code (e.g. 'Model A'), title, and duration are required." },
        { status: 400 }
      );
    }

    const payload = {
      model_code: model_code.trim(),
      title: title.trim(),
      duration: duration.trim(),
      suitable_for: (suitable_for || "").trim(),
      focus: (focus || "").trim(),
      sort_order: Number(sort_order) || 0,
      is_active: Boolean(is_active),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newTrack, error } = await supabase
      .from("duration_models")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert duration track error:", error);
      if (error.code === "PGRST205" || error.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "The duration_models table does not exist in Supabase yet. Run the SQL schema first.",
            tableNotCreated: true,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to add track" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Duration model track created successfully!",
      track: newTrack,
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
    const { id, model_code, title, duration, suitable_for, focus, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Track ID is required." }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (model_code !== undefined) updates.model_code = model_code.trim();
    if (title !== undefined) updates.title = title.trim();
    if (duration !== undefined) updates.duration = duration.trim();
    if (suitable_for !== undefined) updates.suitable_for = suitable_for.trim();
    if (focus !== undefined) updates.focus = focus.trim();
    if (sort_order !== undefined) updates.sort_order = Number(sort_order);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data: updatedTrack, error } = await supabase
      .from("duration_models")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase update duration track error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update track" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Duration model track updated successfully!",
      track: updatedTrack,
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
      return NextResponse.json({ error: "Track ID is required." }, { status: 400 });
    }

    const { error } = await supabase.from("duration_models").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete track error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete track" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Duration track deleted successfully!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
