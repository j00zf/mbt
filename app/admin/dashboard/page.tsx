"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Database,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Eye,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  Copy,
  Clock,
  UserPlus,
  Server,
  Layers,
  Sparkles,
  MapPin,
  AlertTriangle,
  X,
  Building,
  Check,
  Tag,
  GraduationCap,
  Target,
  Menu,
  ChevronRight,
  ExternalLink,
  Code2,
  UserCheck,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  type Internship,
  type ProgrammeSchool,
  type DurationModel,
  type StudentApplication,
  DEFAULT_MBT_SCHOOLS,
  DEFAULT_DURATION_MODELS,
} from "@/lib/supabase";

interface AdminRecord {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

interface InternshipFormData {
  title: string;
  school_code: string;
  school_name: string;
  duration_model: string;
  duration_hours_months: string;
  target_audience: string;
  project_focus: string;
  location: string;
  workplace_type: "Remote" | "Hybrid" | "Onsite";
  internship_type: "Full-time" | "Part-time";
  stipend: string;
  openings: number;
  description: string;
  requirements: string;
  responsibilities: string;
  skills: string;
  deadline: string;
  status: "active" | "draft" | "closed";
}

interface SchoolFormData {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface TrackFormData {
  model_code: string;
  title: string;
  duration: string;
  suitable_for: string;
  focus: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Navigation sidebar tab
  const [activeTab, setActiveTab] = useState<
    "internships" | "applications" | "schools" | "tracks" | "admins" | "schema"
  >("internships");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auth & data
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [schools, setSchools] = useState<ProgrammeSchool[]>([]);
  const [tracks, setTracks] = useState<DurationModel[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);

  // Tables state notice
  const [tableNotCreated, setTableNotCreated] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [workplaceFilter, setWorkplaceFilter] = useState<string>("all");

  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [appSchoolFilter, setAppSchoolFilter] = useState<string>("all");

  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [trackSearchQuery, setTrackSearchQuery] = useState("");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modals - Internships
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [internshipForm, setInternshipForm] = useState<InternshipFormData>({
    title: "",
    school_code: "B",
    school_name: "AI, Data Science & Analytics",
    duration_model: "Model B - Standard",
    duration_hours_months: "120 hrs",
    target_audience: "UG students; curriculum internships",
    project_focus: "Defined project + deliverables",
    location: "Remote",
    workplace_type: "Remote",
    internship_type: "Full-time",
    stipend: "Performance-based",
    openings: 2,
    description: "",
    requirements: "",
    responsibilities: "",
    skills: "Python, Machine Learning, Analytics",
    deadline: "",
    status: "active",
  });

  // Modals - Domains (16 Schools Architecture)
  const [isSchoolAddModalOpen, setIsSchoolAddModalOpen] = useState(false);
  const [isSchoolEditModalOpen, setIsSchoolEditModalOpen] = useState(false);
  const [isSchoolDeleteModalOpen, setIsSchoolDeleteModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<ProgrammeSchool | null>(null);
  const [schoolForm, setSchoolForm] = useState<SchoolFormData>({
    code: "",
    name: "",
    description: "",
    sort_order: 1,
    is_active: true,
  });

  // Modals - Internship Duration (5 Duration Models)
  const [isTrackAddModalOpen, setIsTrackAddModalOpen] = useState(false);
  const [isTrackEditModalOpen, setIsTrackEditModalOpen] = useState(false);
  const [isTrackDeleteModalOpen, setIsTrackDeleteModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<DurationModel | null>(null);
  const [trackForm, setTrackForm] = useState<TrackFormData>({
    model_code: "Model F",
    title: "",
    duration: "",
    suitable_for: "",
    focus: "",
    sort_order: 6,
    is_active: true,
  });

  // Modals - Student Applications
  const [selectedApplication, setSelectedApplication] = useState<StudentApplication | null>(null);
  const [isAppViewModalOpen, setIsAppViewModalOpen] = useState(false);
  const [isAppDeleteModalOpen, setIsAppDeleteModalOpen] = useState(false);
  const [appNotes, setAppNotes] = useState("");

  // Copy states
  const [copiedInternshipSql, setCopiedInternshipSql] = useState(false);
  const [copiedSchoolSql, setCopiedSchoolSql] = useState(false);
  const [copiedTrackSql, setCopiedTrackSql] = useState(false);
  const [copiedAppSql, setCopiedAppSql] = useState(false);
  const [copiedAdminSql, setCopiedAdminSql] = useState(false);

  // SQL Definitions for Schema Tab
  const applicationsTableSql = `create table public.internship_applications (
  id bigint generated always as identity not null,
  internship_id bigint null references public.internships(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  college text not null,
  degree text not null,
  year_of_study text not null,
  school_code text not null,
  school_name text not null,
  duration_model text not null,
  resume_url text null,
  linkedin_url text null,
  statement_of_purpose text null,
  status text not null default 'pending', -- 'pending', 'under_review', 'shortlisted', 'accepted', 'rejected'
  notes text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint internship_applications_pkey primary key (id)
) TABLESPACE pg_default;

alter table public.internship_applications enable row level security;
create policy "Allow all operations for applications" on public.internship_applications for all using (true) with check (true);`;

  const internshipTableSql = `create table if not exists public.internships (
  id bigint generated always as identity not null,
  title text not null,
  school_code text not null,
  school_name text not null,
  duration_model text not null,
  duration_hours_months text not null,
  target_audience text null,
  project_focus text null,
  location text not null default 'Remote',
  workplace_type text not null default 'Remote',
  internship_type text not null default 'Full-time',
  stipend text not null default 'Unpaid',
  openings integer not null default 1,
  description text not null,
  requirements text null,
  responsibilities text null,
  skills text[] null,
  deadline date null,
  status text not null default 'active',
  created_by bigint null references public.admins(id) on delete set null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint internships_pkey primary key (id)
) TABLESPACE pg_default;

-- Enable RLS and grant full permissions for operations
alter table public.internships enable row level security;
drop policy if exists "Allow all operations for internships" on public.internships;
create policy "Allow all operations for internships" on public.internships for all using (true) with check (true);

-- Seed Initial Default Roles (Run if table is newly created or empty)
insert into public.internships (
  title, school_code, school_name, duration_model, duration_hours_months,
  target_audience, project_focus, location, workplace_type, internship_type,
  stipend, openings, description, requirements, responsibilities, skills, deadline, status
) values
(
  'AI & Machine Learning Research Intern',
  'B',
  'AI, Data Science & Analytics',
  'Model B - Standard',
  '120 hrs',
  'UG / PG Engineering, Data Science & BCA students',
  'Predictive modeling, NLP pipelines, data analytics dashboards',
  'Remote / Hybrid',
  'Remote',
  'Full-time',
  'Performance-based / Certificate + Recommendation',
  3,
  'Join our high-impact AI & Data Science School to build state-of-the-art predictive tools and data insights for social sector interventions.',
  'Proficiency in Python, pandas, scikit-learn or PyTorch. Familiarity with SQL.',
  'Data wrangling and exploratory analysis; training baseline ML models.',
  ARRAY['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'Pandas'],
  '2026-11-30',
  'active'
),
(
  'Full-Stack Web Development Intern',
  'A',
  'Technology & Digital Innovation',
  'Model C - Professional',
  '240 hrs',
  'B.Tech/BCA/MCA Computer Science students',
  'Next.js portal development, RESTful APIs, cloud integrations',
  'Remote',
  'Remote',
  'Full-time',
  'Performance-based',
  4,
  'Work alongside our product engineering team to build modern web interfaces, robust backend APIs, and database schemas.',
  'Strong grasp of TypeScript, React, Next.js, and modern CSS/Tailwind.',
  'Build dynamic UI components; integrate Supabase/PostgreSQL APIs.',
  ARRAY['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
  '2026-12-15',
  'active'
),
(
  'UI/UX & Product Design Fellow',
  'D',
  'UI/UX & Design',
  'Model B - Standard',
  '120 hrs',
  'Design students, B.Des, Human-Computer Interaction',
  'User journey mapping, high-fidelity Figma prototypes, design systems',
  'Remote',
  'Remote',
  'Part-time',
  'Certificate + Stipend on milestones',
  2,
  'Craft visually stunning, accessible user interfaces for our non-profit digital platforms.',
  'Demonstrated portfolio in Figma. Solid understanding of visual hierarchy.',
  'Develop user stories and wireframes; design micro-interactions.',
  ARRAY['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'Design Systems'],
  '2026-11-20',
  'active'
),
(
  'Digital Marketing & Growth Associate',
  'J',
  'Digital Marketing & Growth',
  'Model A - Foundation',
  '40–80 hrs',
  'BBA/B.Com, Mass Communication & Marketing students',
  'Social campaigns, SEO optimization, analytics & content outreach',
  'Hybrid',
  'Hybrid',
  'Part-time',
  'Performance bonus + Certificate',
  3,
  'Drive awareness and outreach for MBT initiatives across digital channels.',
  'Excellent communication skills; creative mindset; experience with social media.',
  'Plan and execute content calendars; track engagement metrics.',
  ARRAY['Digital Marketing', 'Content Strategy', 'SEO', 'Social Media', 'Canva'],
  '2026-10-31',
  'active'
),
(
  'Community Outreach & Youth Development Intern',
  'H',
  'Education & Youth Development',
  'Model D - Advanced',
  '3–6 months',
  'Social Work, Psychology, Education, and Humanities graduates',
  'Field workshops, leadership camps, mentorship coordination',
  'Kochi, Kerala / Onsite',
  'Onsite',
  'Full-time',
  'Travel allowance + Stipend',
  5,
  'Engage directly with schools and colleges to conduct youth empowerment workshops.',
  'Passionate about youth leadership and social impact.',
  'Facilitate classroom sessions; coordinate with partner educational institutions.',
  ARRAY['Community Engagement', 'Public Speaking', 'Event Management', 'Mentorship'],
  '2026-12-01',
  'active'
);`;

  const schoolsTableSql = `create table public.programme_schools (
  id bigint generated always as identity not null,
  code text not null unique,
  name text not null,
  description text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint programme_schools_pkey primary key (id)
) TABLESPACE pg_default;

-- Seed the 16 Domains (Schools A through P)
insert into public.programme_schools (code, name, sort_order, is_active) values
('A', 'Technology & Digital Innovation', 1, true),
('B', 'AI, Data Science & Analytics', 2, true),
('C', 'Product & Tech Ecosystem Dev.', 3, true),
('D', 'UI/UX & Design', 4, true),
('E', 'Research & Impact Assessment', 5, true),
('F', 'Programme & Project Mgmt.', 6, true),
('G', 'Community Development', 7, true),
('H', 'Education & Youth Development', 8, true),
('I', 'Media, Communication & Content', 9, true),
('J', 'Digital Marketing & Growth', 10, true),
('K', 'Business Dev. & Partnerships', 11, true),
('L', 'CSR & Fundraising', 12, true),
('M', 'Entrepreneurship & Innovation', 13, true),
('N', 'HR & Talent Management', 14, true),
('O', 'Finance & Administration', 15, true),
('P', 'Events & Operations', 16, true)
on conflict (code) do nothing;

alter table public.programme_schools enable row level security;
create policy "Allow all operations for schools" on public.programme_schools for all using (true) with check (true);`;

  const durationModelsSql = `create table public.duration_models (
  id bigint generated always as identity not null,
  model_code text not null unique,
  title text not null,
  duration text not null,
  suitable_for text not null,
  focus text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint duration_models_pkey primary key (id)
) TABLESPACE pg_default;

-- Seed the 5 Duration Models (Tracks A through E)
insert into public.duration_models (model_code, title, duration, suitable_for, focus, sort_order, is_active) values
('Model A', 'Foundation', '40–80 hrs', 'First-year students; short academic internships; exposure programmes', 'Orientation + observation + basic contribution', 1, true),
('Model B', 'Standard', '120 hrs', 'UG students; curriculum internships', 'Defined project + deliverables', 2, true),
('Model C', 'Professional', '240 hrs', 'BCA/BBA/Engineering/PG; structured university internships', 'End-to-end project ownership', 3, true),
('Model D', 'Advanced', '3–6 months', 'High-performing interns ready for scope', 'Cross-functional projects + leadership', 4, true),
('Model E', 'Fellowship', '6–12 months', 'Exceptional interns', 'Project leadership, innovation & research', 5, true)
on conflict (model_code) do nothing;

alter table public.duration_models enable row level security;
create policy "Allow all operations for duration_models" on public.duration_models for all using (true) with check (true);`;

  const adminsTableSql = `create table public.admins (
  id bigint generated always as identity not null,
  name text not null,
  email text not null,
  password text not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email)
) TABLESPACE pg_default;

alter table public.admins enable row level security;
create policy "Allow all operations for admins" on public.admins for all using (true) with check (true);`;

  // Init Data & Check URL param for tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam &&
        ["internships", "applications", "schools", "tracks", "admins", "schema"].includes(tabParam)
      ) {
        setActiveTab(tabParam as any);
      }
    }

    async function init() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/admin/login");
          return;
        }
        const authData = await authRes.json();
        if (!authData.authenticated || !authData.admin) {
          router.push("/admin/login");
          return;
        }
        setCurrentUser(authData.admin);

        await Promise.all([
          fetchInternships(),
          fetchSchools(),
          fetchTracks(),
          fetchApplications(),
          fetchAdmins(),
        ]);
      } catch (err) {
        console.error("Initialization error:", err);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchInternships = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/internships?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setInternships(data.internships || []);
        setTableNotCreated(Boolean(data.tableNotCreated));
      }
    } catch (err) {
      console.error("Failed to fetch internships:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await fetch("/api/admin/schools");
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    }
  };

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/admin/tracks");
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/admin/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
    }
  };

  // Helper when changing School in form
  const handleSchoolChange = (code: string) => {
    const school = schools.find((s) => s.code === code);
    setInternshipForm((prev) => ({
      ...prev,
      school_code: code,
      school_name: school ? school.name : prev.school_name,
    }));
  };

  // Helper when changing Duration Model in form
  const handleModelChange = (modelName: string) => {
    const track = tracks.find(
      (m) => `${m.model_code} - ${m.title}` === modelName || m.model_code === modelName
    );
    if (track) {
      setInternshipForm((prev) => ({
        ...prev,
        duration_model: `${track.model_code} - ${track.title}`,
        duration_hours_months: track.duration,
        target_audience: track.suitable_for,
        project_focus: track.focus,
      }));
    } else {
      setInternshipForm((prev) => ({
        ...prev,
        duration_model: modelName,
      }));
    }
  };

  // ==========================================
  // INTERNSHIP ACTIONS
  // ==========================================
  const openAddInternshipModal = (prefillSchoolCode?: string) => {
    const targetSchool = prefillSchoolCode
      ? schools.find((s) => s.code === prefillSchoolCode)
      : schools[0] || { code: "A", name: "Technology & Digital Innovation" };

    const targetTrack = tracks[1] || {
      model_code: "Model B",
      title: "Standard",
      duration: "120 hrs",
      suitable_for: "UG students; curriculum internships",
      focus: "Defined project + deliverables",
    };

    setInternshipForm({
      title: "",
      school_code: targetSchool?.code || "A",
      school_name: targetSchool?.name || "Technology & Digital Innovation",
      duration_model: `${targetTrack.model_code} - ${targetTrack.title}`,
      duration_hours_months: targetTrack.duration,
      target_audience: targetTrack.suitable_for,
      project_focus: targetTrack.focus,
      location: "Remote",
      workplace_type: "Remote",
      internship_type: "Full-time",
      stipend: "Performance-based",
      openings: 2,
      description: "",
      requirements: "",
      responsibilities: "",
      skills: "React, TypeScript, Next.js",
      deadline: "",
      status: "active",
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditInternshipModal = (item: Internship) => {
    setSelectedInternship(item);
    setInternshipForm({
      title: item.title,
      school_code: item.school_code,
      school_name: item.school_name,
      duration_model: item.duration_model,
      duration_hours_months: item.duration_hours_months,
      target_audience: item.target_audience || "",
      project_focus: item.project_focus || "",
      location: item.location,
      workplace_type: item.workplace_type,
      internship_type: item.internship_type,
      stipend: item.stipend,
      openings: item.openings,
      description: item.description,
      requirements: item.requirements || "",
      responsibilities: item.responsibilities || "",
      skills: Array.isArray(item.skills) ? item.skills.join(", ") : (item.skills || ""),
      deadline: item.deadline ? item.deadline.substring(0, 10) : "",
      status: item.status,
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleInternshipCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!internshipForm.title.trim() || !internshipForm.description.trim()) {
      setFormError("Role Title and Description are required.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(internshipForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create internship.");

      setIsAddModalOpen(false);
      await fetchInternships();
      showToast("Internship posting created successfully!");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInternshipEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternship) return;
    setFormError(null);

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/internships", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedInternship.id,
          ...internshipForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update internship.");

      setIsEditModalOpen(false);
      await fetchInternships();
      showToast("Internship posting updated successfully!");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInternshipDelete = async () => {
    if (!selectedInternship) return;
    const deletedId = selectedInternship.id;
    setActionLoading(true);
    // Optimistically remove from state so the item disappears immediately
    setInternships((prev) => prev.filter((i) => i.id !== deletedId));
    setIsDeleteModalOpen(false);

    try {
      const res = await fetch(`/api/admin/internships?id=${deletedId}`, {
        method: "DELETE",
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      if (!res.ok) {
        await fetchInternships();
        throw new Error(data.error || "Failed to delete internship.");
      }
      showToast("Internship posting deleted.");
      await fetchInternships();
    } catch (err: unknown) {
      await fetchInternships();
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setActionLoading(false);
      setSelectedInternship(null);
    }
  };

  // ==========================================
  // DOMAINS ACTIONS (16 Schools Dynamic CRUD)
  // ==========================================
  const openAddSchoolModal = () => {
    const currentCodes = schools.map((s) => s.code.toUpperCase());
    let nextLetter = "Q";
    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i);
      if (!currentCodes.includes(letter)) {
        nextLetter = letter;
        break;
      }
    }

    setSchoolForm({
      code: nextLetter,
      name: "",
      description: "",
      sort_order: schools.length + 1,
      is_active: true,
    });
    setFormError(null);
    setIsSchoolAddModalOpen(true);
  };

  const openEditSchoolModal = (school: ProgrammeSchool) => {
    setSelectedSchool(school);
    setSchoolForm({
      code: school.code,
      name: school.name,
      description: school.description || "",
      sort_order: school.sort_order,
      is_active: school.is_active,
    });
    setFormError(null);
    setIsSchoolEditModalOpen(true);
  };

  const handleSchoolCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!schoolForm.code.trim() || !schoolForm.name.trim()) {
      setFormError("Domain Code (e.g. 'A') and Domain Name are required.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create domain.");

      setIsSchoolAddModalOpen(false);
      await fetchSchools();
      showToast(`Domain ${schoolForm.code} created successfully!`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchoolEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setFormError(null);
    if (!schoolForm.code.trim() || !schoolForm.name.trim()) {
      setFormError("Domain Code and Name are required.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSchool.id,
          ...schoolForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update domain.");

      setIsSchoolEditModalOpen(false);
      await fetchSchools();
      showToast(`Domain ${schoolForm.code} updated successfully!`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchoolDelete = async () => {
    if (!selectedSchool) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/schools?id=${selectedSchool.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete domain.");
      setIsSchoolDeleteModalOpen(false);
      await fetchSchools();
      showToast(`Domain ${selectedSchool.code} deleted.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete domain.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // INTERNSHIP DURATION ACTIONS (5 Duration Models)
  // ==========================================
  const openAddTrackModal = () => {
    const nextModelNum = tracks.length + 1;
    const modelLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const modelSuffix = modelLetters[tracks.length] || `Track ${nextModelNum}`;

    setTrackForm({
      model_code: `Model ${modelSuffix}`,
      title: "",
      duration: "",
      suitable_for: "",
      focus: "",
      sort_order: nextModelNum,
      is_active: true,
    });
    setFormError(null);
    setIsTrackAddModalOpen(true);
  };

  const openEditTrackModal = (track: DurationModel) => {
    setSelectedTrack(track);
    setTrackForm({
      model_code: track.model_code,
      title: track.title,
      duration: track.duration,
      suitable_for: track.suitable_for || "",
      focus: track.focus || "",
      sort_order: track.sort_order,
      is_active: track.is_active,
    });
    setFormError(null);
    setIsTrackEditModalOpen(true);
  };

  const handleTrackCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!trackForm.model_code.trim() || !trackForm.title.trim() || !trackForm.duration.trim()) {
      setFormError("Model code (e.g. 'Model F'), title, and duration are required.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create duration model.");

      setIsTrackAddModalOpen(false);
      await fetchTracks();
      showToast(`${trackForm.model_code} created successfully!`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrackEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack) return;
    setFormError(null);
    if (!trackForm.model_code.trim() || !trackForm.title.trim() || !trackForm.duration.trim()) {
      setFormError("Model code, title, and duration are required.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/tracks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTrack.id,
          ...trackForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update duration model.");

      setIsTrackEditModalOpen(false);
      await fetchTracks();
      showToast(`${trackForm.model_code} updated successfully!`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrackDelete = async () => {
    if (!selectedTrack) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/tracks?id=${selectedTrack.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete duration model.");
      setIsTrackDeleteModalOpen(false);
      await fetchTracks();
      showToast(`${selectedTrack.model_code} deleted.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete track.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // APPLICATIONS ACTIONS
  // ==========================================
  const handleUpdateAppStatus = async (appId: number, status: string, notes?: string) => {
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, status, notes }),
      });
      if (res.ok) {
        await fetchApplications();
        if (selectedApplication && selectedApplication.id === appId) {
          setSelectedApplication((prev) =>
            prev ? { ...prev, status: status as any, notes: notes || prev.notes } : null
          );
        }
        showToast(`Application #${appId} updated to ${status}.`);
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleAppDelete = async () => {
    if (!selectedApplication) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/applications?id=${selectedApplication.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      setIsAppDeleteModalOpen(false);
      setIsAppViewModalOpen(false);
      await fetchApplications();
      showToast("Application record deleted.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete application.");
    } finally {
      setActionLoading(false);
    }
  };

  // Copy helper
  const copyText = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Filtered internships
  const filteredInternships = internships.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.school_name && item.school_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesSchool = schoolFilter === "all" || item.school_code === schoolFilter;
    const matchesModel =
      modelFilter === "all" || (item.duration_model && item.duration_model.startsWith(modelFilter));
    const matchesWorkplace = workplaceFilter === "all" || item.workplace_type === workplaceFilter;

    return matchesSearch && matchesStatus && matchesSchool && matchesModel && matchesWorkplace;
  });

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    const query = appSearchQuery.toLowerCase();
    const matchesSearch =
      app.full_name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.college.toLowerCase().includes(query) ||
      app.degree.toLowerCase().includes(query) ||
      app.phone.includes(query);

    const matchesStatus = appStatusFilter === "all" || app.status === appStatusFilter;
    const matchesSchool = appSchoolFilter === "all" || app.school_code === appSchoolFilter;

    return matchesSearch && matchesStatus && matchesSchool;
  });

  // Filtered domains
  const filteredSchools = schools.filter((s) => {
    const q = schoolSearchQuery.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  // Filtered duration tracks
  const filteredTracks = tracks.filter((t) => {
    const q = trackSearchQuery.toLowerCase();
    return (
      t.model_code.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.duration.toLowerCase().includes(q) ||
      (t.suitable_for && t.suitable_for.toLowerCase().includes(q)) ||
      (t.focus && t.focus.toLowerCase().includes(q))
    );
  });

  const activeCount = internships.filter((i) => i.status === "active").length;
  const totalOpenings = internships.reduce((sum, i) => sum + (Number(i.openings) || 0), 0);

  const pendingAppsCount = applications.filter((a) => a.status === "pending").length;
  const shortlistedAppsCount = applications.filter((a) => a.status === "shortlisted").length;
  const acceptedAppsCount = applications.filter((a) => a.status === "accepted").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium tracking-wide">
            Loading Admin Control Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2.5 animate-bounce-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* =========================================================================
          LEFT SIDEBAR
      ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/mbt.svg" alt="Mission Better Tomorrow" className="h-8 w-auto object-contain" />
              <div>
                <span className="font-bold text-slate-900 text-sm tracking-tight block">
                  MBT Internship
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Admin Control Panel
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-6">
            {/* Primary Section */}
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Internship Management
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("internships");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "internships"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4" />
                    <span>Internship Postings</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeTab === "internships"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {internships.length}
                  </span>
                </button>

                {/* Registered Students / Applications */}
                <button
                  onClick={() => {
                    setActiveTab("applications");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "applications"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4" />
                    <span>Student Applicants</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeTab === "applications"
                      ? "bg-white/20 text-white"
                      : pendingAppsCount > 0
                        ? "bg-emerald-100 text-emerald-800 font-bold"
                        : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {applications.length}
                  </span>
                </button>
              </nav>
            </div>

            {/* Architecture Section: Domains & Internship Duration */}
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Domains & Internship Duration
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("schools");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "schools"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Domains </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeTab === "schools"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {schools.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("tracks");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "tracks"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Target className="w-4 h-4" />
                    <span>Internship Duration</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeTab === "tracks"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {tracks.length}
                  </span>
                </button>
              </nav>
            </div>

            {/* Administration & Config */}
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Database & Security
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("admins");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "admins"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Admins</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeTab === "admins"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {admins.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("schema");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "schema"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4" />
                    <span>SQL Schemas</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">Ready</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {currentUser?.name || "Admin"}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {currentUser?.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 capitalize tracking-tight">
                {activeTab === "internships" && "Internship Openings Management"}
                {activeTab === "applications" && "Student Applicant Registration"}
                {activeTab === "schools" && "Domains (16 Schools Architecture)"}
                {activeTab === "tracks" && "Internship Duration (5 Tracks Models)"}
                {activeTab === "admins" && "System Administrators"}
                {activeTab === "schema" && "Supabase SQL Schemas & Seeding"}
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Mission Better Tomorrow &bull; Internship Programme Administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/apply"
              target="_blank"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-2xs"
            >
              <span>Public Apply Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {activeTab === "internships" && (
              <button
                onClick={() => openAddInternshipModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Internship</span>
              </button>
            )}

            {activeTab === "schools" && (
              <button
                onClick={openAddSchoolModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Domain</span>
              </button>
            )}

            {activeTab === "tracks" && (
              <button
                onClick={openAddTrackModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Internship Duration</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Body */}
        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* =========================================================================
              TAB: DOMAINS (16 Schools Dynamic Architecture)
          ========================================================================= */}
          {activeTab === "schools" && (
            <div className="space-y-6">
              {/* Top Banner & Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Total Domains
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">
                      {schools.length}
                    </span>
                    <span className="text-xs text-slate-500">domains registered</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Discipline architecture tracks</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Active Domains
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-600 tracking-tight">
                      {schools.filter((s) => s.is_active).length}
                    </span>
                    <span className="text-xs text-slate-500">open for enrollment</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Available in student applications</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Internship Roles
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-teal-600 tracking-tight">
                      {internships.length}
                    </span>
                    <span className="text-xs text-slate-500">roles across domains</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Mapped to MBT functional areas</p>
                </div>
              </div>

              {/* Search & Actions Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search domains by code (e.g. A, B) or name..."
                    value={schoolSearchQuery}
                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={fetchSchools}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer shadow-xs"
                    title="Refresh Domains"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={openAddSchoolModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Domain</span>
                  </button>
                </div>
              </div>

              {/* Domains Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredSchools.length === 0 ? (
                  <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No domains match your search query.</p>
                    <button
                      onClick={() => setSchoolSearchQuery("")}
                      className="mt-3 text-xs text-emerald-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  filteredSchools.map((school) => {
                    const rolesInSchool = internships.filter((i) => i.school_code === school.code);
                    return (
                      <div
                        key={school.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 font-bold text-sm flex items-center justify-center shadow-xs">
                              {school.code}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${school.is_active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                                  }`}
                              >
                                {school.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm leading-snug">
                            {school.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                            {school.description || "Core functional domain within MBT internship."}
                          </p>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Sort Order: #{school.sort_order}</span>
                            <span className="font-semibold text-emerald-700">
                              {rolesInSchool.length} active {rolesInSchool.length === 1 ? "role" : "roles"}
                            </span>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                          <button
                            onClick={() => openAddInternshipModal(school.code)}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Create Internship in this domain"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Role</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditSchoolModal(school)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Edit Domain"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSchool(school);
                                setIsSchoolDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Domain"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: INTERNSHIP DURATION (5 Duration Models Dynamic CRUD)
          ========================================================================= */}
          {activeTab === "tracks" && (
            <div className="space-y-6">
              {/* Header & Overview */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Internship Duration (5 Tracks)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Dynamic duration frameworks aligned with student academic levels, credits, and project complexity.
                    Changes update live across all student application forms.
                  </p>
                </div>
                <button
                  onClick={openAddTrackModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Internship Duration</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search model code (e.g. Model A) or title..."
                  value={trackSearchQuery}
                  onChange={(e) => setTrackSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Duration Models Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {filteredTracks.length === 0 ? (
                  <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                    <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No duration models match your query.</p>
                  </div>
                ) : (
                  filteredTracks.map((track) => (
                    <div
                      key={track.id}
                      className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                            {track.model_code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${track.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-400"
                              }`}
                          >
                            {track.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                            {track.title}
                          </h4>
                          <div className="text-2xl font-bold text-emerald-700 tracking-tight mt-0.5">
                            {track.duration}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Suitable For
                            </span>
                            <p className="text-slate-700 text-xs mt-0.5 leading-snug">
                              {track.suitable_for || "All interested candidates."}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Project Focus
                            </span>
                            <p className="text-slate-700 text-xs mt-0.5 leading-snug">
                              {track.focus || "Hands-on organizational contribution."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Sort: #{track.sort_order}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditTrackModal(track)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit Duration Model"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTrack(track);
                              setIsTrackDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Duration Model"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: STUDENT APPLICATIONS
          ========================================================================= */}
          {activeTab === "applications" && (
            <div className="space-y-6">
              {/* Application Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Applicants
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">
                      {applications.length}
                    </span>
                    <span className="text-xs text-slate-500">registered</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Across all 16 domains</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pending Review
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-amber-600 tracking-tight">
                      {pendingAppsCount}
                    </span>
                    <span className="text-xs text-slate-500">awaiting</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Needs admin decision</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Shortlisted
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-teal-600 tracking-tight">
                      {shortlistedAppsCount}
                    </span>
                    <span className="text-xs text-slate-500">students</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Selected for interviews</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Accepted
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-indigo-600 tracking-tight">
                      {acceptedAppsCount}
                    </span>
                    <span className="text-xs text-slate-500">onboarded</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Active programme interns</p>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                {/* Search & Filters */}
                <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student, email, phone, college, degree..."
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={appStatusFilter}
                      onChange={(e) => setAppStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold cursor-pointer outline-none focus:border-emerald-600"
                    >
                      <option value="all">All Application Statuses</option>
                      <option value="pending">Pending Review</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <select
                      value={appSchoolFilter}
                      onChange={(e) => setAppSchoolFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold cursor-pointer outline-none focus:border-emerald-600"
                    >
                      <option value="all">All Domains ({schools.length})</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.code}>
                          School {s.code}: {s.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={fetchApplications}
                      disabled={refreshing}
                      className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 cursor-pointer shadow-xs"
                      title="Refresh applicants"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">App ID</th>
                        <th className="px-6 py-3.5">Student Information</th>
                        <th className="px-6 py-3.5">College & Degree</th>
                        <th className="px-6 py-3.5">Applied Domain & Duration</th>
                        <th className="px-6 py-3.5">Links</th>
                        <th className="px-6 py-3.5">Decision Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-14 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <UserCheck className="w-8 h-8 text-slate-300" />
                              <p className="font-semibold text-slate-600">
                                {applications.length === 0
                                  ? "No students have applied yet. Share the public registration link!"
                                  : "No student applications match your filter."}
                              </p>
                              <Link
                                href="/apply"
                                target="_blank"
                                className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 cursor-pointer flex items-center gap-1.5"
                              >
                                <span>Open Public Application Page</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-500">
                              #APP-{app.id}
                            </td>

                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 text-sm">{app.full_name}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5 font-medium">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{app.email}</span>
                                </div>
                                <div className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{app.phone}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800">{app.college}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {app.degree} &bull; <span className="text-slate-700 font-medium">{app.year_of_study}</span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                                <span>School {app.school_code}: {app.school_name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{app.duration_model}</span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {app.resume_url && (
                                  <a
                                    href={app.resume_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[11px] flex items-center gap-1 px-2 font-medium"
                                  >
                                    <span>Resume</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {app.linkedin_url && (
                                  <a
                                    href={app.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-[11px] flex items-center gap-1 px-2 font-medium"
                                  >
                                    <span>LinkedIn</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {!app.resume_url && !app.linkedin_url && (
                                  <span className="text-slate-400 text-[11px]">-</span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-colors ${app.status === "shortlisted"
                                  ? "bg-teal-50 text-teal-800 border-teal-200"
                                  : app.status === "accepted"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : app.status === "rejected"
                                      ? "bg-rose-50 text-rose-800 border-rose-200"
                                      : app.status === "under_review"
                                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                        : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setAppNotes(app.notes || "");
                                    setIsAppViewModalOpen(true);
                                  }}
                                  title="View Applicant Profile"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setIsAppDeleteModalOpen(true);
                                  }}
                                  title="Delete Application"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: INTERNSHIPS
          ========================================================================= */}
          {activeTab === "internships" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Total Postings
                  </span>
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">
                    {internships.length}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Active Roles
                  </span>
                  <span className="text-3xl font-bold text-emerald-600 tracking-tight">
                    {activeCount}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Total Seats
                  </span>
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">
                    {totalOpenings}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Student Applicants
                  </span>
                  <span className="text-3xl font-bold text-indigo-600 tracking-tight">
                    {applications.length}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search roles, domains, locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={schoolFilter}
                      onChange={(e) => setSchoolFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium"
                    >
                      <option value="all">All Domains ({schools.length})</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.code}>
                          School {s.code}: {s.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={fetchInternships}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5">ID</th>
                        <th className="px-5 py-3.5">Domain</th>
                        <th className="px-5 py-3.5">Role Title</th>
                        <th className="px-5 py-3.5">Duration Track</th>
                        <th className="px-5 py-3.5">Workplace</th>
                        <th className="px-5 py-3.5">Type & Stipend</th>
                        <th className="px-5 py-3.5">Seats</th>
                        <th className="px-5 py-3.5">Deadline</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                      {filteredInternships.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                            No internship postings found. Click &quot;New Internship&quot; to add one!
                          </td>
                        </tr>
                      ) : (
                        filteredInternships.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4 font-mono text-slate-400">#{item.id}</td>
                            <td className="px-5 py-4 font-semibold text-slate-800 max-w-[200px] truncate" title={`School ${item.school_code}: ${item.school_name}`}>
                              School {item.school_code}: {item.school_name}
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-900">
                              {item.title}
                              {item.project_focus && (
                                <div className="text-[11px] font-normal text-slate-400 truncate max-w-[220px]" title={item.project_focus}>
                                  {item.project_focus}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              <div className="font-medium">{item.duration_model}</div>
                              <div className="text-[11px] text-slate-400">{item.duration_hours_months}</div>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              <span className="font-medium">{item.workplace_type}</span>
                              <div className="text-[11px] text-slate-400">{item.location}</div>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              <span className="font-medium text-slate-700">{item.internship_type || "Full-time"}</span>
                              <div className="text-[11px] text-slate-400 truncate max-w-[130px]" title={item.stipend}>
                                {item.stipend || "Unpaid"}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-800">{item.openings}</td>
                            <td className="px-5 py-4 text-slate-500 font-medium">
                              {item.deadline ? item.deadline.substring(0, 10) : <span className="text-slate-400 italic">Open</span>}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                  item.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : item.status === "draft"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedInternship(item);
                                    setIsViewModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditInternshipModal(item)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="Edit Internship"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedInternship(item);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete Internship"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: ADMINS
          ========================================================================= */}
          {activeTab === "admins" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">System Administrators</h3>
                  <p className="text-xs text-slate-500">Authorized personnel who can manage the portal</p>
                </div>
                <Link
                  href="/admin/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20"
                >
                  Register Admin
                </Link>
              </div>

              <div className="space-y-3 mt-4">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                        {admin.name?.[0]?.toUpperCase() || "A"}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{admin.name}</div>
                        <div className="text-slate-500 font-mono mt-0.5">{admin.email}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                      Active Admin #{admin.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: SCHEMAS
          ========================================================================= */}
          {activeTab === "schema" && (
            <div className="space-y-6">
              {/* Domains Table SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Domains (16 Schools Architecture) Schema
                    </h3>
                    <p className="text-xs text-slate-500">
                      Table <code className="font-mono text-slate-700 font-semibold">public.programme_schools</code>
                    </p>
                  </div>
                  <button
                    onClick={() => copyText(schoolsTableSql, setCopiedSchoolSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                  >
                    {copiedSchoolSql ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSchoolSql ? "Copied" : "Copy SQL"}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {schoolsTableSql}
                </pre>
              </div>

              {/* Internship Duration Models SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Internship Duration (5 Tracks Models) Schema
                    </h3>
                    <p className="text-xs text-slate-500">
                      Table <code className="font-mono text-slate-700 font-semibold">public.duration_models</code>
                    </p>
                  </div>
                  <button
                    onClick={() => copyText(durationModelsSql, setCopiedTrackSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                  >
                    {copiedTrackSql ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedTrackSql ? "Copied" : "Copy SQL"}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {durationModelsSql}
                </pre>
              </div>

              {/* Applications SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Student Applications Schema</h3>
                    <p className="text-xs text-slate-500">
                      Table <code className="font-mono text-slate-700 font-semibold">public.internship_applications</code>
                    </p>
                  </div>
                  <button
                    onClick={() => copyText(applicationsTableSql, setCopiedAppSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                  >
                    {copiedAppSql ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedAppSql ? "Copied" : "Copy SQL"}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {applicationsTableSql}
                </pre>
              </div>

              {/* Internships SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Internships Table Schema</h3>
                    <p className="text-xs text-slate-500">
                      Table <code className="font-mono text-slate-700 font-semibold">public.internships</code>
                    </p>
                  </div>
                  <button
                    onClick={() => copyText(internshipTableSql, setCopiedInternshipSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                  >
                    {copiedInternshipSql ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedInternshipSql ? "Copied" : "Copy SQL"}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {internshipTableSql}
                </pre>
              </div>

              {/* Admins SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Admins Schema</h3>
                    <p className="text-xs text-slate-500">
                      Table <code className="font-mono text-slate-700 font-semibold">public.admins</code>
                    </p>
                  </div>
                  <button
                    onClick={() => copyText(adminsTableSql, setCopiedAdminSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                  >
                    {copiedAdminSql ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedAdminSql ? "Copied" : "Copy SQL"}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {adminsTableSql}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODALS: DOMAINS (ADD, EDIT, DELETE)
      ========================================================================= */}
      {/* 1. Add Domain Modal */}
      {isSchoolAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Domain</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define a functional department domain in the architecture</p>
              </div>
              <button
                onClick={() => setIsSchoolAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSchoolCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code (e.g. A, B)</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={schoolForm.code}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                    placeholder="Q"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold uppercase outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Domain Name</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.name}
                    onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                    placeholder="e.g. Clean Energy & Sustainability"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Focus Areas</label>
                <textarea
                  rows={3}
                  value={schoolForm.description}
                  onChange={(e) => setSchoolForm({ ...schoolForm, description: e.target.value })}
                  placeholder="Summary of domain scope, projects, and activities in this domain..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={schoolForm.sort_order}
                    onChange={(e) => setSchoolForm({ ...schoolForm, sort_order: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="pt-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add_school_active"
                    checked={schoolForm.is_active}
                    onChange={(e) => setSchoolForm({ ...schoolForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="add_school_active" className="font-semibold text-slate-700 cursor-pointer">
                    Active for applications
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm shadow-emerald-600/20"
                >
                  {actionLoading ? "Saving..." : "Create Domain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Domain Modal */}
      {isSchoolEditModalOpen && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Domain {selectedSchool.code}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Modify domain title, description, or ordering</p>
              </div>
              <button
                onClick={() => setIsSchoolEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSchoolEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={schoolForm.code}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold uppercase outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Domain Name</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.name}
                    onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Focus Areas</label>
                <textarea
                  rows={3}
                  value={schoolForm.description}
                  onChange={(e) => setSchoolForm({ ...schoolForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={schoolForm.sort_order}
                    onChange={(e) => setSchoolForm({ ...schoolForm, sort_order: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="pt-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_school_active"
                    checked={schoolForm.is_active}
                    onChange={(e) => setSchoolForm({ ...schoolForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="edit_school_active" className="font-semibold text-slate-700 cursor-pointer">
                    Active for applications
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm shadow-emerald-600/20"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Domain Modal */}
      {isSchoolDeleteModalOpen && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Domain {selectedSchool.code}?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Are you sure you want to remove <strong>{selectedSchool.name}</strong> from the domain architecture?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsSchoolDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSchoolDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: INTERNSHIP DURATION (ADD, EDIT, DELETE)
      ========================================================================= */}
      {/* 1. Add Internship Duration Track Modal */}
      {isTrackAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add Internship Duration Track</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define student internship timeline, duration, and target scope</p>
              </div>
              <button
                onClick={() => setIsTrackAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleTrackCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Model Code (e.g. Model F)</label>
                  <input
                    type="text"
                    required
                    value={trackForm.model_code}
                    onChange={(e) => setTrackForm({ ...trackForm, model_code: e.target.value })}
                    placeholder="Model F"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Track Title</label>
                  <input
                    type="text"
                    required
                    value={trackForm.title}
                    onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                    placeholder="e.g. Advanced Fellowship"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Hours / Months)</label>
                <input
                  type="text"
                  required
                  value={trackForm.duration}
                  onChange={(e) => setTrackForm({ ...trackForm, duration: e.target.value })}
                  placeholder="e.g. 180 hrs or 4 months"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Suitable For (Target Audience)</label>
                <input
                  type="text"
                  value={trackForm.suitable_for}
                  onChange={(e) => setTrackForm({ ...trackForm, suitable_for: e.target.value })}
                  placeholder="e.g. Final year UG / Postgraduates"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Focus / Key Deliverables</label>
                <textarea
                  rows={2}
                  value={trackForm.focus}
                  onChange={(e) => setTrackForm({ ...trackForm, focus: e.target.value })}
                  placeholder="e.g. In-depth research, full product sprint, deployment"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={trackForm.sort_order}
                    onChange={(e) => setTrackForm({ ...trackForm, sort_order: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="pt-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add_track_active"
                    checked={trackForm.is_active}
                    onChange={(e) => setTrackForm({ ...trackForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="add_track_active" className="font-semibold text-slate-700 cursor-pointer">
                    Active for applications
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTrackAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm shadow-emerald-600/20"
                >
                  {actionLoading ? "Saving..." : "Create Model"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Track Modal */}
      {isTrackEditModalOpen && selectedTrack && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit {selectedTrack.model_code}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Modify duration, audience, or deliverables</p>
              </div>
              <button
                onClick={() => setIsTrackEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleTrackEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Model Code</label>
                  <input
                    type="text"
                    required
                    value={trackForm.model_code}
                    onChange={(e) => setTrackForm({ ...trackForm, model_code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Track Title</label>
                  <input
                    type="text"
                    required
                    value={trackForm.title}
                    onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Hours / Months)</label>
                <input
                  type="text"
                  required
                  value={trackForm.duration}
                  onChange={(e) => setTrackForm({ ...trackForm, duration: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Suitable For (Target Audience)</label>
                <input
                  type="text"
                  value={trackForm.suitable_for}
                  onChange={(e) => setTrackForm({ ...trackForm, suitable_for: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Focus / Key Deliverables</label>
                <textarea
                  rows={2}
                  value={trackForm.focus}
                  onChange={(e) => setTrackForm({ ...trackForm, focus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={trackForm.sort_order}
                    onChange={(e) => setTrackForm({ ...trackForm, sort_order: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="pt-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_track_active"
                    checked={trackForm.is_active}
                    onChange={(e) => setTrackForm({ ...trackForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <label htmlFor="edit_track_active" className="font-semibold text-slate-700 cursor-pointer">
                    Active for applications
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTrackEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm shadow-emerald-600/20"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Track Modal */}
      {isTrackDeleteModalOpen && selectedTrack && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete {selectedTrack.model_code}?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Are you sure you want to remove <strong>{selectedTrack.title} ({selectedTrack.duration})</strong>?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsTrackDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTrackDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: INTERNSHIPS (CREATE, EDIT, VIEW, DELETE)
      ========================================================================= */}
      {/* 1. Add Internship Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create Internship Opening</h3>
                <p className="text-xs text-slate-400 mt-0.5">Post an opportunity aligned with the MBT 16 Domains and 5 Duration Tracks</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleInternshipCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Domain / School *</label>
                  <select
                    value={internshipForm.school_code}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.code}>
                        School {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration Track *</label>
                  <select
                    value={internshipForm.duration_model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={`${t.model_code} - ${t.title}`}>
                        {t.model_code} - {t.title} ({t.duration})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Internship Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Research Intern / Product Design Fellow"
                    value={internshipForm.title}
                    onChange={(e) => setInternshipForm({ ...internshipForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Open Seats (Openings)</label>
                  <input
                    type="number"
                    min={1}
                    value={internshipForm.openings}
                    onChange={(e) => setInternshipForm({ ...internshipForm, openings: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Workplace</label>
                  <select
                    value={internshipForm.workplace_type}
                    onChange={(e) => setInternshipForm({ ...internshipForm, workplace_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Remote / Kochi, Kerala"
                    value={internshipForm.location}
                    onChange={(e) => setInternshipForm({ ...internshipForm, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Internship Type</label>
                  <select
                    value={internshipForm.internship_type}
                    onChange={(e) => setInternshipForm({ ...internshipForm, internship_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration Hours / Months</label>
                  <input
                    type="text"
                    placeholder="120 hrs / 3–6 months"
                    value={internshipForm.duration_hours_months}
                    onChange={(e) => setInternshipForm({ ...internshipForm, duration_hours_months: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stipend / Support</label>
                  <input
                    type="text"
                    placeholder="Unpaid / Performance-based / ₹10,000/mo"
                    value={internshipForm.stipend}
                    onChange={(e) => setInternshipForm({ ...internshipForm, stipend: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={internshipForm.deadline}
                    onChange={(e) => setInternshipForm({ ...internshipForm, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    placeholder="e.g. UG / PG Engineering & BCA students"
                    value={internshipForm.target_audience}
                    onChange={(e) => setInternshipForm({ ...internshipForm, target_audience: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Focus</label>
                  <input
                    type="text"
                    placeholder="e.g. Predictive ML models, NLP pipelines"
                    value={internshipForm.project_focus}
                    onChange={(e) => setInternshipForm({ ...internshipForm, project_focus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Overview of the role, team, and scope of work..."
                  value={internshipForm.description}
                  onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Key Responsibilities</label>
                  <textarea
                    rows={2}
                    placeholder="Deliverables, tasks, and sprint activities..."
                    value={internshipForm.responsibilities}
                    onChange={(e) => setInternshipForm({ ...internshipForm, responsibilities: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requirements & Qualifications</label>
                  <textarea
                    rows={2}
                    placeholder="Required tools, knowledge, and degree qualifications..."
                    value={internshipForm.requirements}
                    onChange={(e) => setInternshipForm({ ...internshipForm, requirements: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skills (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Python, React, Machine Learning, SQL"
                    value={internshipForm.skills}
                    onChange={(e) => setInternshipForm({ ...internshipForm, skills: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={internshipForm.status}
                    onChange={(e) => setInternshipForm({ ...internshipForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none capitalize"
                  >
                    <option value="active">Active (Visible & Open)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm shadow-emerald-600/20"
                >
                  {actionLoading ? "Publishing..." : "Publish Internship"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Internship Modal */}
      {isEditModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Internship #{selectedInternship.id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedInternship.title}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleInternshipEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Domain / School *</label>
                  <select
                    value={internshipForm.school_code}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.code}>
                        School {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration Track *</label>
                  <select
                    value={internshipForm.duration_model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={`${t.model_code} - ${t.title}`}>
                        {t.model_code} - {t.title} ({t.duration})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Internship Role Title *</label>
                  <input
                    type="text"
                    required
                    value={internshipForm.title}
                    onChange={(e) => setInternshipForm({ ...internshipForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Open Seats (Openings)</label>
                  <input
                    type="number"
                    min={1}
                    value={internshipForm.openings}
                    onChange={(e) => setInternshipForm({ ...internshipForm, openings: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Workplace</label>
                  <select
                    value={internshipForm.workplace_type}
                    onChange={(e) => setInternshipForm({ ...internshipForm, workplace_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={internshipForm.location}
                    onChange={(e) => setInternshipForm({ ...internshipForm, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Internship Type</label>
                  <select
                    value={internshipForm.internship_type}
                    onChange={(e) => setInternshipForm({ ...internshipForm, internship_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration Hours / Months</label>
                  <input
                    type="text"
                    value={internshipForm.duration_hours_months}
                    onChange={(e) => setInternshipForm({ ...internshipForm, duration_hours_months: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stipend / Support</label>
                  <input
                    type="text"
                    value={internshipForm.stipend}
                    onChange={(e) => setInternshipForm({ ...internshipForm, stipend: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={internshipForm.deadline}
                    onChange={(e) => setInternshipForm({ ...internshipForm, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={internshipForm.target_audience}
                    onChange={(e) => setInternshipForm({ ...internshipForm, target_audience: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Focus</label>
                  <input
                    type="text"
                    value={internshipForm.project_focus}
                    onChange={(e) => setInternshipForm({ ...internshipForm, project_focus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Description *</label>
                <textarea
                  rows={3}
                  required
                  value={internshipForm.description}
                  onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Key Responsibilities</label>
                  <textarea
                    rows={2}
                    value={internshipForm.responsibilities}
                    onChange={(e) => setInternshipForm({ ...internshipForm, responsibilities: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requirements & Qualifications</label>
                  <textarea
                    rows={2}
                    value={internshipForm.requirements}
                    onChange={(e) => setInternshipForm({ ...internshipForm, requirements: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={internshipForm.skills}
                    onChange={(e) => setInternshipForm({ ...internshipForm, skills: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={internshipForm.status}
                    onChange={(e) => setInternshipForm({ ...internshipForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold outline-none capitalize"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm shadow-emerald-600/20"
                >
                  {actionLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. View Internship Modal */}
      {isViewModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                  School {selectedInternship.school_code}: {selectedInternship.school_name}
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{selectedInternship.title}</h3>
                <p className="text-xs text-slate-500">
                  {selectedInternship.duration_model} &bull; {selectedInternship.workplace_type} ({selectedInternship.location}) &bull; {selectedInternship.internship_type || "Full-time"}
                </p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Openings</span>
                  <span className="font-semibold text-slate-900">{selectedInternship.openings} seats</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Duration</span>
                  <span className="font-semibold text-slate-900">{selectedInternship.duration_hours_months || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Stipend</span>
                  <span className="font-semibold text-slate-900">{selectedInternship.stipend || "Unpaid"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                  <span className="font-bold text-emerald-700 capitalize">{selectedInternship.status}</span>
                </div>
              </div>

              {(selectedInternship.target_audience || selectedInternship.project_focus || selectedInternship.deadline) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                  {selectedInternship.target_audience && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Audience</span>
                      <span className="font-medium text-slate-800">{selectedInternship.target_audience}</span>
                    </div>
                  )}
                  {selectedInternship.project_focus && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Project Focus</span>
                      <span className="font-medium text-slate-800">{selectedInternship.project_focus}</span>
                    </div>
                  )}
                  {selectedInternship.deadline && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Application Deadline</span>
                      <span className="font-semibold text-slate-900">{selectedInternship.deadline.substring(0, 10)}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">Description</h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedInternship.description}</p>
              </div>

              {selectedInternship.responsibilities && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Key Responsibilities</h4>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedInternship.responsibilities}</p>
                </div>
              )}

              {selectedInternship.requirements && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Requirements & Qualifications</h4>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedInternship.requirements}</p>
                </div>
              )}

              {selectedInternship.skills && selectedInternship.skills.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedInternship.skills)
                      ? selectedInternship.skills
                      : String(selectedInternship.skills).split(",")
                    ).map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                        {String(skill).trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditInternshipModal(selectedInternship);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer"
              >
                Edit Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Internship Modal */}
      {isDeleteModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Internship Opening?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Delete <strong>{selectedInternship.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleInternshipDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: STUDENT APPLICATIONS (VIEW & DELETE)
      ========================================================================= */}
      {/* 1. View Student Application Modal */}
      {isAppViewModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  Reference: #APP-{selectedApplication.id}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedApplication.full_name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedApplication.email}</span>
                  <span>&bull;</span>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedApplication.phone}</span>
                </p>
              </div>

              <button
                onClick={() => setIsAppViewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">College / University</span>
                  <span className="font-semibold text-slate-800">{selectedApplication.college}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Degree & Stage</span>
                  <span className="font-semibold text-slate-800">
                    {selectedApplication.degree} ({selectedApplication.year_of_study})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Preferred Domain</span>
                  <span className="font-bold text-teal-800">
                    School {selectedApplication.school_code}: {selectedApplication.school_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration Track</span>
                  <span className="font-bold text-slate-800">{selectedApplication.duration_model}</span>
                </div>
              </div>

              {selectedApplication.statement_of_purpose && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Statement of Purpose
                  </span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedApplication.statement_of_purpose}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                {selectedApplication.resume_url && (
                  <a
                    href={selectedApplication.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                  >
                    <span>View Resume / Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {selectedApplication.linkedin_url && (
                  <a
                    href={selectedApplication.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200 flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
                  >
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Status & Review Notes */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Decision Status
                  </span>
                  <select
                    value={selectedApplication.status}
                    onChange={(e) => handleUpdateAppStatus(selectedApplication.id, e.target.value, appNotes)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs bg-slate-50 cursor-pointer outline-none focus:border-emerald-600"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Internal Admin Notes
                  </span>
                  <textarea
                    rows={2}
                    placeholder="Add interview notes, mentor assignment..."
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-600"
                  />
                  <button
                    onClick={() => handleUpdateAppStatus(selectedApplication.id, selectedApplication.status, appNotes)}
                    className="mt-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => setIsAppViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Student Application Modal */}
      {isAppDeleteModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Application?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Delete candidate record for <strong>{selectedApplication.full_name}</strong>?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsAppDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAppDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
