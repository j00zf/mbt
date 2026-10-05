import fs from "fs";
import path from "path";
import {
  DEFAULT_MBT_SCHOOLS,
  DEFAULT_DURATION_MODELS,
  ProgrammeSchool,
  DurationModel,
} from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const SCHOOLS_FILE = path.join(DATA_DIR, "mbt_schools.json");
const TRACKS_FILE = path.join(DATA_DIR, "mbt_tracks.json");

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

// ==========================================
// SCHOOLS FALLBACK STORAGE
// ==========================================
export function getLocalSchools(): ProgrammeSchool[] {
  ensureDirectoryExists();
  try {
    if (fs.existsSync(SCHOOLS_FILE)) {
      const content = fs.readFileSync(SCHOOLS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read local schools file, using defaults:", err);
  }

  // Seed default 16 schools
  const seeded: ProgrammeSchool[] = DEFAULT_MBT_SCHOOLS.map((s, idx) => ({
    ...s,
    id: idx + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  saveLocalSchools(seeded);
  return seeded;
}

export function saveLocalSchools(schools: ProgrammeSchool[]) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(SCHOOLS_FILE, JSON.stringify(schools, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write schools file:", err);
  }
}

export function addLocalSchool(item: Omit<ProgrammeSchool, "id">): ProgrammeSchool {
  const current = getLocalSchools();
  const nextId = current.length > 0 ? Math.max(...current.map((s) => s.id)) + 1 : 1;
  const newSchool: ProgrammeSchool = {
    ...item,
    id: nextId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  current.push(newSchool);
  saveLocalSchools(current);
  return newSchool;
}

export function updateLocalSchool(id: number, updates: Partial<ProgrammeSchool>): ProgrammeSchool | null {
  const current = getLocalSchools();
  const index = current.findIndex((s) => s.id === id);
  if (index === -1) return null;
  current[index] = {
    ...current[index],
    ...updates,
    id,
    updated_at: new Date().toISOString(),
  };
  saveLocalSchools(current);
  return current[index];
}

export function deleteLocalSchool(id: number): boolean {
  const current = getLocalSchools();
  const filtered = current.filter((s) => s.id !== id);
  if (filtered.length === current.length) return false;
  saveLocalSchools(filtered);
  return true;
}

// ==========================================
// TRACKS FALLBACK STORAGE
// ==========================================
export function getLocalTracks(): DurationModel[] {
  ensureDirectoryExists();
  try {
    if (fs.existsSync(TRACKS_FILE)) {
      const content = fs.readFileSync(TRACKS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read local tracks file, using defaults:", err);
  }

  // Seed default 5 tracks
  const seeded: DurationModel[] = DEFAULT_DURATION_MODELS.map((t, idx) => ({
    ...t,
    id: idx + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  saveLocalTracks(seeded);
  return seeded;
}

export function saveLocalTracks(tracks: DurationModel[]) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(TRACKS_FILE, JSON.stringify(tracks, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write tracks file:", err);
  }
}

export function addLocalTrack(item: Omit<DurationModel, "id">): DurationModel {
  const current = getLocalTracks();
  const nextId = current.length > 0 ? Math.max(...current.map((t) => t.id)) + 1 : 1;
  const newTrack: DurationModel = {
    ...item,
    id: nextId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  current.push(newTrack);
  saveLocalTracks(current);
  return newTrack;
}

export function updateLocalTrack(id: number, updates: Partial<DurationModel>): DurationModel | null {
  const current = getLocalTracks();
  const index = current.findIndex((t) => t.id === id);
  if (index === -1) return null;
  current[index] = {
    ...current[index],
    ...updates,
    id,
    updated_at: new Date().toISOString(),
  };
  saveLocalTracks(current);
  return current[index];
}

export function deleteLocalTrack(id: number): boolean {
  const current = getLocalTracks();
  const filtered = current.filter((t) => t.id !== id);
  if (filtered.length === current.length) return false;
  saveLocalTracks(filtered);
  return true;
}
