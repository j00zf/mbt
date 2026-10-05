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
} from "lucide-react";
import {
  type Internship,
  type ProgrammeSchool,
  type DurationModel,
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
    "internships" | "schools" | "tracks" | "admins" | "schema"
  >("internships");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auth & data
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [schools, setSchools] = useState<ProgrammeSchool[]>([]);
  const [tracks, setTracks] = useState<DurationModel[]>([]);

  const [tableNotCreated, setTableNotCreated] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [workplaceFilter, setWorkplaceFilter] = useState<string>("all");

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
  const [isSchoolViewModalOpen, setIsSchoolViewModalOpen] = useState(false);
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
  const [isTrackViewModalOpen, setIsTrackViewModalOpen] = useState(false);
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

  const [formError, setFormError] = useState<string | null>(null);

  // Copy states
  const [copiedInternshipSql, setCopiedInternshipSql] = useState(false);
  const [copiedSchoolSql, setCopiedSchoolSql] = useState(false);
  const [copiedTrackSql, setCopiedTrackSql] = useState(false);
  const [copiedAdminSql, setCopiedAdminSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Full SQL Definitions
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

  const adminTableSql = `create table public.admins (
  id bigint generated always as identity not null,
  name text not null,
  email text not null,
  password text not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email)
) TABLESPACE pg_default;`;

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

        await Promise.all([fetchInternships(), fetchSchools(), fetchTracks(), fetchAdmins()]);
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
    if (!internshipForm.title.trim()) {
      setFormError("Role Title is required.");
      return;
    }
    if (!internshipForm.description.trim()) {
      setFormError("Description is required.");
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete.");
      }
      setIsDeleteModalOpen(false);
      await fetchInternships();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit School Create
  const handleSchoolCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!schoolForm.code.trim() || !schoolForm.name.trim()) {
      setFormError("School Code and Name are required.");
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
      if (!res.ok) throw new Error(data.error || "Failed to save school.");

      setIsSchoolAddModalOpen(false);
      await fetchSchools();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit School Edit
  const handleSchoolEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setFormError(null);

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
      if (!res.ok) throw new Error(data.error || "Failed to update school.");

      setIsSchoolEditModalOpen(false);
      await fetchSchools();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit School Delete
  const handleSchoolDelete = async (school: ProgrammeSchool) => {
    if (!confirm(`Are you sure you want to delete School ${school.code} (${school.name})?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/schools?id=${school.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed.");
      }
      await fetchSchools();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete school.");
    }
  };

  // Submit Track Create
  const handleTrackCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!trackForm.model_code.trim() || !trackForm.title.trim() || !trackForm.duration.trim()) {
      setFormError("Model code, title, and duration are required.");
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
      if (!res.ok) throw new Error(data.error || "Failed to save track.");

      setIsTrackAddModalOpen(false);
      await fetchTracks();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Track Edit
  const handleTrackEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrack) return;
    setFormError(null);

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
      if (!res.ok) throw new Error(data.error || "Failed to update track.");

      setIsTrackEditModalOpen(false);
      await fetchTracks();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Track Delete
  const handleTrackDelete = async (track: DurationModel) => {
    if (!confirm(`Are you sure you want to delete ${track.model_code}: ${track.title}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/tracks?id=${track.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed.");
      }
      await fetchTracks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete track.");
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

  const activeCount = internships.filter((i) => i.status === "active").length;
  const totalOpenings = internships.reduce((sum, i) => sum + (Number(i.openings) || 0), 0);

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

        {/* Sidebar Footer User Card */}
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
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Live
            </span>
            <Link href="/" target="_blank" className="hover:text-emerald-700 flex items-center gap-0.5">
              <span>Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
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

          {/* Quick Header Action */}
          <div className="flex items-center gap-2">
            {activeTab === "internships" && (
              <button
                onClick={() => openAddInternshipModal()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Internship</span>
                <span className="sm:hidden">New</span>
              </button>
            )}

            {activeTab === "schools" && (
              <button
                onClick={() => {
                  setSchoolForm({
                    code: String.fromCharCode(65 + schools.length),
                    name: "",
                    description: "",
                    sort_order: schools.length + 1,
                    is_active: true,
                  });
                  setFormError(null);
                  setIsSchoolAddModalOpen(true);
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add School</span>
              </button>
            )}

            {activeTab === "tracks" && (
              <button
                onClick={() => {
                  setTrackForm({
                    model_code: `Model ${String.fromCharCode(65 + tracks.length)}`,
                    title: "",
                    duration: "",
                    suitable_for: "",
                    focus: "",
                    sort_order: tracks.length + 1,
                    is_active: true,
                  });
                  setFormError(null);
                  setIsTrackAddModalOpen(true);
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Duration Model</span>
              </button>
            )}

            {activeTab === "admins" && (
              <Link
                href="/admin/register"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Admin</span>
              </Link>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-8 space-y-6 flex-1 max-w-7xl w-full">
          {/* Table Not Created Banner */}
          {tableNotCreated && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Supabase Table <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">public.internships</code> Not Found
                  </h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Execute the database schema in your Supabase SQL Editor.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab("schema");
                  copyText(internshipTableSql, setCopiedInternshipSql);
                }}
                className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL & View Schema</span>
              </button>
            </div>
          )}

          {/* =========================================================================
              TAB: INTERNSHIPS
          ========================================================================= */}
          {activeTab === "internships" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Postings
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {internships.length}
                    </span>
                    <span className="text-xs text-slate-500">openings</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Active Roles
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                      {activeCount}
                    </span>
                    <span className="text-xs text-slate-500">live</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Seats
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {totalOpenings}
                    </span>
                    <span className="text-xs text-slate-500">positions</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Active Schools
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {new Set(internships.map((i) => i.school_code)).size}
                    </span>
                    <span className="text-xs text-slate-500">of {schools.length} Schools</span>
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                {/* Filter Toolbar */}
                <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search roles, schools, locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={schoolFilter}
                      onChange={(e) => setSchoolFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer outline-none focus:border-emerald-600"
                    >
                      <option value="all">All Schools ({schools.length})</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.code}>
                          School {s.code}: {s.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer outline-none focus:border-emerald-600"
                    >
                      <option value="all">All Duration Tracks</option>
                      {tracks.map((m) => (
                        <option key={m.id} value={m.model_code}>
                          {m.model_code}: {m.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium cursor-pointer outline-none focus:border-emerald-600"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="closed">Closed</option>
                    </select>

                    <button
                      onClick={fetchInternships}
                      disabled={refreshing}
                      className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 cursor-pointer shadow-xs"
                      title="Refresh"
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
                        <th className="px-6 py-3.5">ID</th>
                        <th className="px-6 py-3.5">School (Discipline)</th>
                        <th className="px-6 py-3.5">Role Title</th>
                        <th className="px-6 py-3.5">Duration Track</th>
                        <th className="px-6 py-3.5">Location & Type</th>
                        <th className="px-6 py-3.5">Seats</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                      {filteredInternships.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-14 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Briefcase className="w-8 h-8 text-slate-300" />
                              <p className="font-medium text-slate-600">No internship postings match your query.</p>
                              <button
                                onClick={() => openAddInternshipModal()}
                                className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
                              >
                                Create Internship
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredInternships.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-400">#{item.id}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                                <span className="w-4 h-4 rounded bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                                  {item.school_code || "A"}
                                </span>
                                <span className="truncate max-w-[150px]">{item.school_name || "General"}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Stipend: <span className="text-emerald-700 font-semibold">{item.stipend}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{item.duration_model}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {item.duration_hours_months}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-medium text-slate-800">{item.internship_type}</span>
                              <span className="text-slate-300 mx-1">&bull;</span>
                              <span className="text-slate-600">{item.workplace_type} ({item.location})</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-700 border border-slate-200 text-[11px]">
                                {item.openings} seats
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                  item.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : item.status === "draft"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.status === "active"
                                      ? "bg-emerald-600"
                                      : item.status === "draft"
                                      ? "bg-amber-600"
                                      : "bg-rose-600"
                                  }`}
                                />
                                <span className="capitalize">{item.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedInternship(item);
                                    setIsViewModalOpen(true);
                                  }}
                                  title="View Details"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
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
                                      skills: Array.isArray(item.skills) ? item.skills.join(", ") : "",
                                      deadline: item.deadline || "",
                                      status: item.status,
                                    });
                                    setIsEditModalOpen(true);
                                  }}
                                  title="Edit"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedInternship(item);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  title="Delete"
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
              TAB: PROGRAMME SCHOOLS (16 Schools Add/Edit/View)
          ========================================================================= */}
          {activeTab === "schools" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 text-emerald-800">
                    Programme Architecture
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                    Sixteen Internship Schools (Discipline Structure)
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Add new schools, modify names, edit descriptions, or assign openings.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSchoolForm({
                      code: String.fromCharCode(65 + schools.length),
                      name: "",
                      description: "",
                      sort_order: schools.length + 1,
                      is_active: true,
                    });
                    setFormError(null);
                    setIsSchoolAddModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer whitespace-nowrap self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New School</span>
                </button>
              </div>

              {/* Schools Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {schools.map((school) => {
                  const countInSchool = internships.filter((i) => i.school_code === school.code).length;

                  return (
                    <div
                      key={school.id}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                            {school.code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {countInSchool} openings
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                          {school.name}
                        </h3>
                        {school.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {school.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => openAddInternshipModal(school.code)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Role</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedSchool(school);
                              setIsSchoolViewModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSchool(school);
                              setSchoolForm({
                                code: school.code,
                                name: school.name,
                                description: school.description || "",
                                sort_order: school.sort_order,
                                is_active: school.is_active,
                              });
                              setIsSchoolEditModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSchoolDelete(school)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: DURATION MODELS / TRACKS (5 Tracks Add/Edit/View)
          ========================================================================= */}
          {activeTab === "tracks" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-white border border-teal-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-teal-200 text-teal-800">
                    Duration Tracks
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                    Internship Duration Models (Academic & Commitment Tracks)
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Configure models, duration hours, student qualification matching, and core focus objectives.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setTrackForm({
                      model_code: `Model ${String.fromCharCode(65 + tracks.length)}`,
                      title: "",
                      duration: "",
                      suitable_for: "",
                      focus: "",
                      sort_order: tracks.length + 1,
                      is_active: true,
                    });
                    setFormError(null);
                    setIsTrackAddModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer whitespace-nowrap self-start md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Duration Model</span>
                </button>
              </div>

              {/* Tracks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 block">
                          {track.model_code}
                        </span>
                        <h4 className="text-base font-extrabold tracking-tight mt-0.5">{track.title}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedTrack(track);
                            setTrackForm({
                              model_code: track.model_code,
                              title: track.title,
                              duration: track.duration,
                              suitable_for: track.suitable_for,
                              focus: track.focus,
                              sort_order: track.sort_order,
                              is_active: track.is_active,
                            });
                            setIsTrackEditModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTrackDelete(track)}
                          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4 text-xs">
                      <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">{track.duration}</div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 block">
                          Commitment
                        </span>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Suitable For</span>
                          <p className="text-slate-700 leading-relaxed font-medium">{track.suitable_for}</p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Core Focus</span>
                          <p className="text-slate-600 leading-relaxed">{track.focus}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: ADMINISTRATORS
          ========================================================================= */}
          {activeTab === "admins" && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Authorized Admin Accounts
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Managing table <code className="font-mono text-emerald-700">public.admins</code>
                  </p>
                </div>

                <Link
                  href="/admin/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Admin</span>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">ID</th>
                      <th className="px-6 py-3.5">Admin Name</th>
                      <th className="px-6 py-3.5">Email Address</th>
                      <th className="px-6 py-3.5">Registered</th>
                      <th className="px-6 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {admins.map((admin) => {
                      const isSelf = currentUser?.id === admin.id;
                      return (
                        <tr key={admin.id} className={`hover:bg-slate-50/70 transition-colors ${isSelf ? "bg-emerald-50/40" : ""}`}>
                          <td className="px-6 py-4 font-mono text-slate-500">#{admin.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <span>{admin.name}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-semibold">
                                You
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-600">{admin.email}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "Recently"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: POSTGRESQL SCHEMAS & SCRIPTS
          ========================================================================= */}
          {activeTab === "schema" && (
            <div className="space-y-6">
              {/* Schools Table SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Programme Schools Table & 16 Schools Seed SQL</h3>
                      <p className="text-xs text-slate-500">Schema for <code className="font-mono text-slate-700">public.programme_schools</code></p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyText(schoolsTableSql, setCopiedSchoolSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                  >
                    {copiedSchoolSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {schoolsTableSql}
                </pre>
              </div>

              {/* Duration Models Table SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Duration Models Table & 5 Tracks Seed SQL</h3>
                      <p className="text-xs text-slate-500">Schema for <code className="font-mono text-slate-700">public.duration_models</code></p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyText(durationModelsSql, setCopiedTrackSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                  >
                    {copiedTrackSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {durationModelsSql}
                </pre>
              </div>

              {/* Internships Table SQL */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Internships Table Schema</h3>
                      <p className="text-xs text-slate-500">Schema for <code className="font-mono text-slate-700">public.internships</code></p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyText(internshipTableSql, setCopiedInternshipSql)}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                  >
                    {copiedInternshipSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {internshipTableSql}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================= */}
      {/* 1. Add Internship Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                Create New Internship Opening
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">{formError}</div>}

            <form onSubmit={handleInternshipCreateSubmit} className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    School (Discipline) *
                  </label>
                  <select
                    value={internshipForm.school_code}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.code}>School {s.code}: {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration Track *
                  </label>
                  <select
                    value={internshipForm.duration_model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none"
                  >
                    {tracks.map((m) => (
                      <option key={m.id} value={`${m.model_code} - ${m.title}`}>
                        {m.model_code}: {m.title} ({m.duration})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={internshipForm.title}
                    onChange={(e) => setInternshipForm({ ...internshipForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Workplace</label>
                  <select
                    value={internshipForm.workplace_type}
                    onChange={(e) => setInternshipForm({ ...internshipForm, workplace_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Location City</label>
                  <input
                    type="text"
                    value={internshipForm.location}
                    onChange={(e) => setInternshipForm({ ...internshipForm, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Stipend</label>
                  <input
                    type="text"
                    value={internshipForm.stipend}
                    onChange={(e) => setInternshipForm({ ...internshipForm, stipend: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={internshipForm.description}
                  onChange={(e) => setInternshipForm({ ...internshipForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Create Opening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add School Modal */}
      {isSchoolAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                Add Internship School
              </h3>
              <button onClick={() => setIsSchoolAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</div>}

            <form onSubmit={handleSchoolCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">School Code (e.g. Q, R, S) *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={schoolForm.code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal & Policy Affairs"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={schoolForm.description}
                  onChange={(e) => setSchoolForm({ ...schoolForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Edit School Modal */}
      {isSchoolEditModalOpen && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                Edit School {selectedSchool.code}
              </h3>
              <button onClick={() => setIsSchoolEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</div>}

            <form onSubmit={handleSchoolEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">School Code *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={schoolForm.code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={schoolForm.description}
                  onChange={(e) => setSchoolForm({ ...schoolForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  {actionLoading ? "Updating..." : "Update School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Duration Model Modal */}
      {isTrackAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-600" />
                Add Duration Model Track
              </h3>
              <button onClick={() => setIsTrackAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</div>}

            <form onSubmit={handleTrackCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Model Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Model F"
                    value={trackForm.model_code}
                    onChange={(e) => setTrackForm({ ...trackForm, model_code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Immersion"
                    value={trackForm.title}
                    onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Duration Commitment *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 160 hrs or 2–4 months"
                  value={trackForm.duration}
                  onChange={(e) => setTrackForm({ ...trackForm, duration: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Suitable For</label>
                <input
                  type="text"
                  placeholder="e.g. Final-year students, Diploma holders"
                  value={trackForm.suitable_for}
                  onChange={(e) => setTrackForm({ ...trackForm, suitable_for: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Core Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Research & development"
                  value={trackForm.focus}
                  onChange={(e) => setTrackForm({ ...trackForm, focus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTrackAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save Track"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Duration Model Modal */}
      {isTrackEditModalOpen && selectedTrack && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                Edit {selectedTrack.model_code}
              </h3>
              <button onClick={() => setIsTrackEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">{formError}</div>}

            <form onSubmit={handleTrackEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Model Code *</label>
                  <input
                    type="text"
                    required
                    value={trackForm.model_code}
                    onChange={(e) => setTrackForm({ ...trackForm, model_code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={trackForm.title}
                    onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Duration Commitment *</label>
                <input
                  type="text"
                  required
                  value={trackForm.duration}
                  onChange={(e) => setTrackForm({ ...trackForm, duration: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Suitable For</label>
                <input
                  type="text"
                  value={trackForm.suitable_for}
                  onChange={(e) => setTrackForm({ ...trackForm, suitable_for: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Core Focus</label>
                <input
                  type="text"
                  value={trackForm.focus}
                  onChange={(e) => setTrackForm({ ...trackForm, focus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTrackEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                >
                  {actionLoading ? "Updating..." : "Update Track"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Internship Modal */}
      {isViewModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[10px]">
                  School {selectedInternship.school_code}: {selectedInternship.school_name}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedInternship.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedInternship.duration_model} ({selectedInternship.duration_hours_months})</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">Description</h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedInternship.description}
                </div>
              </div>

              {selectedInternship.target_audience && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">Target Candidates</h4>
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-700">{selectedInternship.target_audience}</div>
                </div>
              )}

              {selectedInternship.project_focus && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">Project Focus</h4>
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-700">{selectedInternship.project_focus}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Internship Confirmation Modal */}
      {isDeleteModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Internship?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to permanently delete "{selectedInternship.title}"?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleInternshipDelete}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
