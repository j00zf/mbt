import { createClient } from "@supabase/supabase-js";

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

// 16 MBT Programme Schools
export const MBT_SCHOOLS = [
  { code: "A", name: "Technology & Digital Innovation" },
  { code: "B", name: "AI, Data Science & Analytics" },
  { code: "C", name: "Product & Tech Ecosystem Dev." },
  { code: "D", name: "UI/UX & Design" },
  { code: "E", name: "Research & Impact Assessment" },
  { code: "F", name: "Programme & Project Mgmt." },
  { code: "G", name: "Community Development" },
  { code: "H", name: "Education & Youth Development" },
  { code: "I", name: "Media, Communication & Content" },
  { code: "J", name: "Digital Marketing & Growth" },
  { code: "K", name: "Business Dev. & Partnerships" },
  { code: "L", name: "CSR & Fundraising" },
  { code: "M", name: "Entrepreneurship & Innovation" },
  { code: "N", name: "HR & Talent Management" },
  { code: "O", name: "Finance & Administration" },
  { code: "P", name: "Events & Operations" },
] as const;

// 5 MBT Duration Models
export const MBT_DURATION_MODELS = [
  {
    model: "Model A",
    title: "Foundation",
    duration: "40–80 hrs",
    suitableFor: "First-year students; short academic internships; exposure programmes",
    focus: "Orientation + observation + basic contribution",
  },
  {
    model: "Model B",
    title: "Standard",
    duration: "120 hrs",
    suitableFor: "UG students; curriculum internships",
    focus: "Defined project + deliverables",
  },
  {
    model: "Model C",
    title: "Professional",
    duration: "240 hrs",
    suitableFor: "BCA/BBA/Engineering/PG; structured university internships",
    focus: "End-to-end project ownership",
  },
  {
    model: "Model D",
    title: "Advanced",
    duration: "3–6 months",
    suitableFor: "High-performing interns ready for scope",
    focus: "Cross-functional projects + leadership",
  },
  {
    model: "Model E",
    title: "Fellowship",
    duration: "6–12 months",
    suitableFor: "Exceptional interns",
    focus: "Project leadership, innovation & research",
  },
] as const;

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
  created_at: string;
  updated_at?: string | null;
}
