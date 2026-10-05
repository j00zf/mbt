import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { supabase, DurationModel } from "@/lib/supabase";
import {
  getLocalTracks,
  addLocalTrack,
  updateLocalTrack,
  deleteLocalTrack,
} from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const { data: tracks, error } = await supabase
      .from("duration_models")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist")) {
        const localList = getLocalTracks();
        return NextResponse.json({
          tracks: localList,
          tableNotCreated: true,
          message: "The duration_models table has not been created in Supabase yet. Using local dynamic store.",
        });
      }

      console.warn("Supabase fetch tracks error, falling back to local store:", error);
      const localList = getLocalTracks();
      return NextResponse.json({
        tracks: localList,
        tableNotCreated: true,
        message: error.message,
      });
    }

    if (!tracks || tracks.length === 0) {
      const localList = getLocalTracks();
      return NextResponse.json({
        tracks: localList,
        tableNotCreated: false,
      });
    }

    return NextResponse.json({ tracks, tableNotCreated: false });
  } catch (err: unknown) {
    console.error("GET /api/admin/tracks error:", err);
    const localList = getLocalTracks();
    return NextResponse.json({ tracks: localList, tableNotCreated: true });
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
      suitable_for = "",
      focus = "",
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
    };

    // Try Supabase first
    const { data: newTrack, error } = await supabase
      .from("duration_models")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist")) {
        const localSaved = addLocalTrack(payload);
        return NextResponse.json({
          success: true,
          track: localSaved,
          tableNotCreated: true,
          message: "Duration model created successfully! (Saved to local store. Run the SQL schema to sync to Supabase).",
        });
      }

      console.error("Supabase insert duration track error:", error);
      const localSaved = addLocalTrack(payload);
      return NextResponse.json({
        success: true,
        track: localSaved,
        tableNotCreated: true,
        message: "Duration model created in fallback store.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Duration model track created successfully!",
      track: newTrack,
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
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist")) {
        const localUpdated = updateLocalTrack(Number(id), updates);
        return NextResponse.json({
          success: true,
          track: localUpdated,
          tableNotCreated: true,
          message: "Duration model updated successfully (saved locally).",
        });
      }

      console.error("Supabase update duration track error:", error);
      const localUpdated = updateLocalTrack(Number(id), updates);
      return NextResponse.json({
        success: true,
        track: localUpdated,
        tableNotCreated: true,
        message: "Duration model updated in fallback store.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Duration model track updated successfully!",
      track: updatedTrack,
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
      return NextResponse.json({ error: "Track ID is required." }, { status: 400 });
    }

    const numericId = Number(id);

    const { error } = await supabase.from("duration_models").delete().eq("id", numericId);

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist")) {
        deleteLocalTrack(numericId);
        return NextResponse.json({
          success: true,
          tableNotCreated: true,
          message: "Duration track deleted successfully from local store.",
        });
      }

      console.error("Supabase delete track error:", error);
      deleteLocalTrack(numericId);
      return NextResponse.json({
        success: true,
        tableNotCreated: true,
        message: "Duration track deleted from fallback store.",
      });
    }

    deleteLocalTrack(numericId);

    return NextResponse.json({
      success: true,
      message: "Duration track deleted successfully!",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
