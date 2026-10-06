import { createClient } from "@supabase/supabase-js";

// Polyfill WebSocket in Node.js runtime (Node < 22) to prevent RealtimeClient crash
if (typeof globalThis.WebSocket === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    globalThis.WebSocket = require("ws");
  } catch {
    // ignore if in an environment where ws is unavailable
  }
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tsytoncpwouudlrvwyew.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_WX46LzzPZzuLdz7G3jp0vQ_AAUcesCN";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
  },
});

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface ProgrammeSchool {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface DurationModel {
  id: number;
  model_code: string;
  title: string;
  duration: string;
  suitable_for: string;
  focus: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

// 16 Default MBT Programme Schools (Fallback & Seeding)
export const DEFAULT_MBT_SCHOOLS: Omit<ProgrammeSchool, "id">[] = [
  { code: "A", name: "Technology & Digital Innovation", sort_order: 1, is_active: true },
  { code: "B", name: "AI, Data Science & Analytics", sort_order: 2, is_active: true },
  { code: "C", name: "Product & Tech Ecosystem Dev.", sort_order: 3, is_active: true },
  { code: "D", name: "UI/UX & Design", sort_order: 4, is_active: true },
  { code: "E", name: "Research & Impact Assessment", sort_order: 5, is_active: true },
  { code: "F", name: "Programme & Project Mgmt.", sort_order: 6, is_active: true },
  { code: "G", name: "Community Development", sort_order: 7, is_active: true },
  { code: "H", name: "Education & Youth Development", sort_order: 8, is_active: true },
  { code: "I", name: "Media, Communication & Content", sort_order: 9, is_active: true },
  { code: "J", name: "Digital Marketing & Growth", sort_order: 10, is_active: true },
  { code: "K", name: "Business Dev. & Partnerships", sort_order: 11, is_active: true },
  { code: "L", name: "CSR & Fundraising", sort_order: 12, is_active: true },
  { code: "M", name: "Entrepreneurship & Innovation", sort_order: 13, is_active: true },
  { code: "N", name: "HR & Talent Management", sort_order: 14, is_active: true },
  { code: "O", name: "Finance & Administration", sort_order: 15, is_active: true },
  { code: "P", name: "Events & Operations", sort_order: 16, is_active: true },
];

// 5 Default MBT Duration Models (Fallback & Seeding)
export const DEFAULT_DURATION_MODELS: Omit<DurationModel, "id">[] = [
  {
    model_code: "Model A",
    title: "Foundation",
    duration: "40–80 hrs",
    suitable_for: "First-year students; short academic internships; exposure programmes",
    focus: "Orientation + observation + basic contribution",
    sort_order: 1,
    is_active: true,
  },
  {
    model_code: "Model B",
    title: "Standard",
    duration: "120 hrs",
    suitable_for: "UG students; curriculum internships",
    focus: "Defined project + deliverables",
    sort_order: 2,
    is_active: true,
  },
  {
    model_code: "Model C",
    title: "Professional",
    duration: "240 hrs",
    suitable_for: "BCA/BBA/Engineering/PG; structured university internships",
    focus: "End-to-end project ownership",
    sort_order: 3,
    is_active: true,
  },
  {
    model_code: "Model D",
    title: "Advanced",
    duration: "3–6 months",
    suitable_for: "High-performing interns ready for scope",
    focus: "Cross-functional projects + leadership",
    sort_order: 4,
    is_active: true,
  },
  {
    model_code: "Model E",
    title: "Fellowship",
    duration: "6–12 months",
    suitable_for: "Exceptional interns",
    focus: "Project leadership, innovation & research",
    sort_order: 5,
    is_active: true,
  },
];

// Aliases for compatibility
export const MBT_SCHOOLS = DEFAULT_MBT_SCHOOLS;
export const MBT_DURATION_MODELS = DEFAULT_DURATION_MODELS;

export interface Internship {
  id: number;
  title: string;
  school_code: string;
  school_name: string;
  duration_model: string;
  duration_hours_months: string;
  target_audience?: string | null;
  project_focus?: string | null;
  location: string;
  workplace_type: "Remote" | "Hybrid" | "Onsite";
  internship_type: "Full-time" | "Part-time";
  stipend: string;
  openings: number;
  description: string;
  requirements?: string | null;
  responsibilities?: string | null;
  skills?: string[] | null;
  deadline?: string | null;
  status: "active" | "draft" | "closed";
  created_by?: number | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface StudentApplication {
  id: number;
  internship_id?: number | null;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  degree: string;
  year_of_study: string;
  school_code: string;
  school_name: string;
  duration_model: string;
  resume_url?: string | null;
  linkedin_url?: string | null;
  statement_of_purpose?: string | null;
  status: "pending" | "under_review" | "shortlisted" | "accepted" | "rejected";
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
}
