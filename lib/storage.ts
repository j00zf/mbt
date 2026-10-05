import fs from "fs";
import path from "path";
import {
  DEFAULT_MBT_SCHOOLS,
  DEFAULT_DURATION_MODELS,
  ProgrammeSchool,
  DurationModel,
  Internship,
} from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const SCHOOLS_FILE = path.join(DATA_DIR, "mbt_schools.json");
const TRACKS_FILE = path.join(DATA_DIR, "mbt_tracks.json");
const INTERNSHIPS_FILE = path.join(DATA_DIR, "mbt_internships.json");

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

// ==========================================
// INTERNSHIPS FALLBACK STORAGE
// ==========================================
export const DEFAULT_INITIAL_INTERNSHIPS: Omit<Internship, "id">[] = [
  {
    title: "AI & Machine Learning Research Intern",
    school_code: "B",
    school_name: "AI, Data Science & Analytics",
    duration_model: "Model B - Standard",
    duration_hours_months: "120 hrs",
    target_audience: "UG / PG Engineering, Data Science & BCA students",
    project_focus: "Predictive modeling, NLP pipelines, data analytics dashboards",
    location: "Remote / Hybrid",
    workplace_type: "Remote",
    internship_type: "Full-time",
    stipend: "Performance-based / Certificate + Recommendation",
    openings: 3,
    description:
      "Join our high-impact AI & Data Science School to build state-of-the-art predictive tools and data insights for social sector interventions. You will collaborate directly with seasoned engineering mentors on machine learning algorithms and community datasets.",
    requirements:
      "Proficiency in Python, pandas, scikit-learn or PyTorch. Familiarity with SQL and data visualization libraries.",
    responsibilities:
      "Data wrangling and exploratory analysis; training baseline ML models; contributing to production documentation and weekly sprint updates.",
    skills: ["Python", "Machine Learning", "Data Analysis", "SQL", "Pandas"],
    deadline: "2026-11-30",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    title: "Full-Stack Web Development Intern",
    school_code: "A",
    school_name: "Technology & Digital Innovation",
    duration_model: "Model C - Professional",
    duration_hours_months: "240 hrs",
    target_audience: "B.Tech/BCA/MCA Computer Science students",
    project_focus: "Next.js portal development, RESTful APIs, cloud integrations",
    location: "Remote",
    workplace_type: "Remote",
    internship_type: "Full-time",
    stipend: "Performance-based",
    openings: 4,
    description:
      "Work alongside our product engineering team to build modern web interfaces, robust backend APIs, and database schemas supporting thousands of youth and community leaders.",
    requirements:
      "Strong grasp of TypeScript, React, Next.js, and modern CSS/Tailwind. Understanding of relational databases and Git version control.",
    responsibilities:
      "Build dynamic UI components; integrate Supabase/PostgreSQL APIs; optimize web performance and participate in code reviews.",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"],
    deadline: "2026-12-15",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    title: "UI/UX & Product Design Fellow",
    school_code: "D",
    school_name: "UI/UX & Design",
    duration_model: "Model B - Standard",
    duration_hours_months: "120 hrs",
    target_audience: "Design students, B.Des, Human-Computer Interaction",
    project_focus: "User journey mapping, high-fidelity Figma prototypes, design systems",
    location: "Remote",
    workplace_type: "Remote",
    internship_type: "Part-time",
    stipend: "Certificate + Stipend on milestones",
    openings: 2,
    description:
      "Craft visually stunning, accessible user interfaces for our non-profit digital platforms. You will conduct user research, create wireframes, and design scalable UI component libraries.",
    requirements:
      "Demonstrated portfolio in Figma. Solid understanding of visual hierarchy, typography, design systems, and responsive design.",
    responsibilities:
      "Develop user stories and wireframes; design micro-interactions; collaborate closely with frontend developers.",
    skills: ["Figma", "UI/UX Design", "Wireframing", "Prototyping", "Design Systems"],
    deadline: "2026-11-20",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    title: "Digital Marketing & Growth Associate",
    school_code: "J",
    school_name: "Digital Marketing & Growth",
    duration_model: "Model A - Foundation",
    duration_hours_months: "40–80 hrs",
    target_audience: "BBA/B.Com, Mass Communication & Marketing students",
    project_focus: "Social campaigns, SEO optimization, analytics & content outreach",
    location: "Hybrid",
    workplace_type: "Hybrid",
    internship_type: "Part-time",
    stipend: "Performance bonus + Certificate",
    openings: 3,
    description:
      "Drive awareness and outreach for MBT initiatives across digital channels. Gain hands-on exposure to organic growth campaigns, social storytelling, and campaign analytics.",
    requirements:
      "Excellent communication skills; creative mindset; experience with social media platforms and copywriting.",
    responsibilities:
      "Plan and execute content calendars; track engagement metrics; run creative marketing campaigns.",
    skills: ["Digital Marketing", "Content Strategy", "SEO", "Social Media", "Canva"],
    deadline: "2026-10-31",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    title: "Community Outreach & Youth Development Intern",
    school_code: "H",
    school_name: "Education & Youth Development",
    duration_model: "Model D - Advanced",
    duration_hours_months: "3–6 months",
    target_audience: "Social Work, Psychology, Education, and Humanities graduates",
    project_focus: "Field workshops, leadership camps, mentorship coordination",
    location: "Kochi, Kerala / Onsite",
    workplace_type: "Onsite",
    internship_type: "Full-time",
    stipend: "Travel allowance + Stipend",
    openings: 5,
    description:
      "Engage directly with schools and colleges to conduct youth empowerment workshops, leadership modules, and career mentorship initiatives under the Mission Better Tomorrow banner.",
    requirements:
      "Passionate about youth leadership and social impact. Fluency in Malayalam and English preferred.",
    responsibilities:
      "Facilitate classroom sessions; coordinate with partner educational institutions; document impact stories.",
    skills: ["Community Engagement", "Public Speaking", "Event Management", "Mentorship"],
    deadline: "2026-12-01",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function getLocalInternships(): Internship[] {
  ensureDirectoryExists();
  try {
    if (fs.existsSync(INTERNSHIPS_FILE)) {
      const content = fs.readFileSync(INTERNSHIPS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read local internships file, using defaults:", err);
  }

  const seeded: Internship[] = DEFAULT_INITIAL_INTERNSHIPS.map((item, idx) => ({
    ...item,
    id: idx + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  saveLocalInternships(seeded);
  return seeded;
}

export function saveLocalInternships(items: Internship[]) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(INTERNSHIPS_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write internships file:", err);
  }
}

export function addLocalInternship(item: Omit<Internship, "id">): Internship {
  const current = getLocalInternships();
  const nextId = current.length > 0 ? Math.max(...current.map((i) => i.id)) + 1 : 1;
  const newInternship: Internship = {
    ...item,
    id: nextId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  current.unshift(newInternship);
  saveLocalInternships(current);
  return newInternship;
}

export function updateLocalInternship(id: number, updates: Partial<Internship>): Internship | null {
  const current = getLocalInternships();
  const index = current.findIndex((i) => i.id === id);
  if (index === -1) return null;
  current[index] = {
    ...current[index],
    ...updates,
    id,
    updated_at: new Date().toISOString(),
  };
  saveLocalInternships(current);
  return current[index];
}

export function deleteLocalInternship(id: number): boolean {
  const current = getLocalInternships();
  const filtered = current.filter((i) => i.id !== id);
  if (filtered.length === current.length) return false;
  saveLocalInternships(filtered);
  return true;
}
