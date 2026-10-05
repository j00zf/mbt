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

  // Navigation sidebar item
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

  const [tableNotCreated, setTableNotCreated] = useState(false);

  // Filters for internships
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [workplaceFilter, setWorkplaceFilter] = useState<string>("all");

  // Filters for applications
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [appSchoolFilter, setAppSchoolFilter] = useState<string>("all");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  // Modals - Schools
  const [isSchoolAddModalOpen, setIsSchoolAddModalOpen] = useState(false);
  const [isSchoolEditModalOpen, setIsSchoolEditModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<ProgrammeSchool | null>(null);
  const [schoolForm, setSchoolForm] = useState<SchoolFormData>({
    code: "",
    name: "",
    description: "",
    sort_order: 1,
    is_active: true,
  });

  // Modals - Tracks
  const [isTrackAddModalOpen, setIsTrackAddModalOpen] = useState(false);
  const [isTrackEditModalOpen, setIsTrackEditModalOpen] = useState(false);
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

  const [formError, setFormError] = useState<string | null>(null);

  // Copy states
  const [copiedInternshipSql, setCopiedInternshipSql] = useState(false);
  const [copiedSchoolSql, setCopiedSchoolSql] = useState(false);
  const [copiedTrackSql, setCopiedTrackSql] = useState(false);
  const [copiedAppSql, setCopiedAppSql] = useState(false);
  const [copiedAdminSql, setCopiedAdminSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // SQL Definitions
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

  const internshipTableSql = `create table public.internships (
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

alter table public.internships enable row level security;
create policy "Allow all operations for internships" on public.internships for all using (true) with check (true);`;

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

-- Seed the 16 Schools (A through P)
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

  // Init Data
  useEffect(() => {
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

  const fetchInternships = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/internships");
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

  // Open Internship Add Modal
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

  // Submit Internship Create
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
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Internship Edit
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
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Internship Delete
  const handleInternshipDelete = async () => {
    if (!selectedInternship) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/internships?id=${selectedInternship.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete.");
      setIsDeleteModalOpen(false);
      await fetchInternships();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Application Status
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
          setSelectedApplication((prev) => (prev ? { ...prev, status: status as any, notes: notes || prev.notes } : null));
        }
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Delete Application
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
      {/* =========================================================================
          LEFT SIDEBAR (Full Control Navigation)
      ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1px] flex items-center justify-center shadow-md shadow-emerald-500/10">
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-sm tracking-tight block">
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "internships"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4" />
                    <span>Internship Postings</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === "internships"
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "applications"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4" />
                    <span>Student Applicants</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === "applications"
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

            {/* Architecture Section */}
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Programme Structure & Tracks
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("schools");
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "schools"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>16 Schools (Discipline)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === "schools"
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "tracks"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Target className="w-4 h-4" />
                    <span>5 Duration Models</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === "tracks"
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "admins"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Administrators</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === "admins"
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "schema"
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>PostgreSQL Schemas</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="truncate text-xs">
                <div className="font-bold text-slate-800 truncate">{currentUser?.name}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
            <Link href="/apply" target="_blank" className="hover:text-emerald-700 flex items-center gap-1 font-semibold text-emerald-800">
              <span>Public Apply Form</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="flex items-center gap-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* =========================================================================
          MAIN CONTENT AREA
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 capitalize tracking-tight flex items-center gap-2">
                {activeTab === "internships" && (
                  <>
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>Internship Postings</span>
                  </>
                )}
                {activeTab === "applications" && (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Registered Student Applications</span>
                  </>
                )}
                {activeTab === "schools" && (
                  <>
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Proposed Programme Structure (16 Schools)</span>
                  </>
                )}
                {activeTab === "tracks" && (
                  <>
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span>Internship Duration Models (5 Tracks)</span>
                  </>
                )}
                {activeTab === "admins" && (
                  <>
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>System Administrators</span>
                  </>
                )}
                {activeTab === "schema" && (
                  <>
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>PostgreSQL Database Schemas</span>
                  </>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "internships" && (
              <button
                onClick={() => openAddInternshipModal()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Internship</span>
              </button>
            )}

            {activeTab === "applications" && (
              <Link
                href="/apply"
                target="_blank"
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Public Form</span>
              </Link>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-7xl w-full">
          {/* =========================================================================
              TAB: REGISTERED STUDENTS / APPLICATIONS
          ========================================================================= */}
          {activeTab === "applications" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Applicants
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {applications.length}
                    </span>
                    <span className="text-xs text-slate-500">students</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Submitted applications</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Pending Reviews
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                      {pendingAppsCount}
                    </span>
                    <span className="text-xs text-slate-500">awaiting review</span>
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
                    <span className="text-3xl font-extrabold text-teal-600 tracking-tight">
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
                    <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">
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
                    {/* Status Filter */}
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

                    {/* School Filter */}
                    <select
                      value={appSchoolFilter}
                      onChange={(e) => setAppSchoolFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold cursor-pointer outline-none focus:border-emerald-600"
                    >
                      <option value="all">All Schools (A–P)</option>
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
                        <th className="px-6 py-3.5">Applied School & Track</th>
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
                                    <ExternalLink className="w-3 h-3" />
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
                                    <ExternalLink className="w-3 h-3" />
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
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-colors ${
                                  app.status === "shortlisted"
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
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {internships.length}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Active Roles
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                    {activeCount}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Total Seats
                  </span>
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {totalOpenings}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                    Student Applicants
                  </span>
                  <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">
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
                      placeholder="Search roles, schools, locations..."
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
                      <option value="all">All Schools ({schools.length})</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.code}>
                          School {s.code}: {s.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={fetchInternships}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">ID</th>
                        <th className="px-6 py-3.5">School</th>
                        <th className="px-6 py-3.5">Role Title</th>
                        <th className="px-6 py-3.5">Track</th>
                        <th className="px-6 py-3.5">Workplace</th>
                        <th className="px-6 py-3.5">Seats</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                      {filteredInternships.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400">#{item.id}</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            School {item.school_code}: {item.school_name}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{item.title}</td>
                          <td className="px-6 py-4 text-slate-600">{item.duration_model}</td>
                          <td className="px-6 py-4 text-slate-600">{item.workplace_type} ({item.location})</td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{item.openings}</td>
                          <td className="px-6 py-4 capitalize font-semibold text-emerald-700">{item.status}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedInternship(item);
                                  setIsViewModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-emerald-700"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedInternship(item);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-rose-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: SCHOOLS
          ========================================================================= */}
          {activeTab === "schools" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">16 Schools (Discipline Architecture)</h2>
                  <p className="text-xs text-slate-500">Manage all functional departments in the MBT programme</p>
                </div>
                <button
                  onClick={() => setIsSchoolAddModalOpen(true)}
                  className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add School</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {schools.map((school) => (
                  <div key={school.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-extrabold text-xs flex items-center justify-center mb-2">
                      {school.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{school.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{school.description || "Active discipline track."}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: DURATION TRACKS
          ========================================================================= */}
          {activeTab === "tracks" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">5 Duration Models</h2>
                  <p className="text-xs text-slate-500">Tracks matched to student stage and commitment</p>
                </div>
                <button
                  onClick={() => setIsTrackAddModalOpen(true)}
                  className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Track</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {tracks.map((track) => (
                  <div key={track.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
                    <span className="text-[10px] font-bold text-teal-700 uppercase">{track.model_code}</span>
                    <h4 className="text-base font-extrabold text-slate-900">{track.title}</h4>
                    <div className="text-xl font-black text-slate-900">{track.duration}</div>
                    <div className="text-xs text-slate-600"><strong>Suitable:</strong> {track.suitable_for}</div>
                    <div className="text-xs text-slate-600"><strong>Focus:</strong> {track.focus}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: ADMINS
          ========================================================================= */}
          {activeTab === "admins" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">System Administrators</h3>
                <Link
                  href="/admin/register"
                  className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
                >
                  Register Admin
                </Link>
              </div>
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{admin.name}</div>
                      <div className="text-slate-500 font-mono">{admin.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px]">
                      Admin #{admin.id}
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
              {/* Applications SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Student Applications Schema</h3>
                    <p className="text-xs text-slate-500">Schema for <code className="font-mono text-slate-700">public.internship_applications</code></p>
                  </div>
                  <button
                    onClick={() => copyText(applicationsTableSql, setCopiedAppSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold"
                  >
                    {copiedAppSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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
                  <h3 className="text-sm font-bold text-slate-900">Internships Table Schema</h3>
                  <button
                    onClick={() => copyText(internshipTableSql, setCopiedInternshipSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold"
                  >
                    {copiedInternshipSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedInternshipSql ? "Copied" : "Copy SQL"}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                  {internshipTableSql}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          VIEW STUDENT APPLICATION MODAL
      ========================================================================= */}
      {isAppViewModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  Reference: #APP-{selectedApplication.id}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedApplication.full_name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedApplication.email}</span>
                  <span>&bull;</span>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedApplication.phone}</span>
                </p>
              </div>

              <button onClick={() => setIsAppViewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
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
                  <span className="font-semibold text-slate-800">{selectedApplication.degree} ({selectedApplication.year_of_study})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Preferred Discipline</span>
                  <span className="font-bold text-teal-800">School {selectedApplication.school_code}: {selectedApplication.school_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration Track</span>
                  <span className="font-bold text-slate-800">{selectedApplication.duration_model}</span>
                </div>
              </div>

              {selectedApplication.statement_of_purpose && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Statement of Purpose</span>
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
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Decision Status</span>
                  <select
                    value={selectedApplication.status}
                    onChange={(e) => handleUpdateAppStatus(selectedApplication.id, e.target.value, appNotes)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Internal Admin Notes</span>
                  <textarea
                    rows={2}
                    placeholder="Add notes about candidate interview, mentor assignment..."
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none"
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

      {/* DELETE APPLICATION CONFIRMATION */}
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
              <button onClick={() => setIsAppDeleteModalOpen(false)} className="px-4 py-2 rounded-xl border text-xs">
                Cancel
              </button>
              <button onClick={handleAppDelete} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Internship Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Create Internship Opening</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInternshipCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">School</label>
                <select
                  value={internshipForm.school_code}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="w-full border rounded-xl p-2"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.code}>School {s.code}: {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={internshipForm.title}
                  onChange={(e) => setInternshipForm({ ...internshipForm, title: e.target.value })}
                  className="w-full border rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={internshipForm.description}
                  onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
                  className="w-full border rounded-xl p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">
                  {actionLoading ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
