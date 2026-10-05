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
  Compass,
} from "lucide-react";
import {
  type Internship,
  MBT_SCHOOLS,
  MBT_DURATION_MODELS,
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

const defaultDurationModel = MBT_DURATION_MODELS[1]; // Model B - Standard

const emptyInternshipForm: InternshipFormData = {
  title: "",
  school_code: "B",
  school_name: "AI, Data Science & Analytics",
  duration_model: `${defaultDurationModel.model} - ${defaultDurationModel.title}`,
  duration_hours_months: defaultDurationModel.duration as string,
  target_audience: defaultDurationModel.suitableFor as string,
  project_focus: defaultDurationModel.focus as string,
  location: "Remote",
  workplace_type: "Remote",
  internship_type: "Full-time",
  stipend: "Performance-based",
  openings: 2,
  description: "",
  requirements: "",
  responsibilities: "",
  skills: "Python, Machine Learning, Data Analytics",
  deadline: "",
  status: "active",
};

export default function AdminDashboardPage() {
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "internships" | "programme_structure" | "admins" | "schema"
  >("internships");

  // Auth & data
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
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

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected item & form state
  const [selectedInternship, setSelectedInternship] =
    useState<Internship | null>(null);
  const [formData, setFormData] = useState(emptyInternshipForm);
  const [formError, setFormError] = useState<string | null>(null);

  // Copy states
  const [copiedInternshipSql, setCopiedInternshipSql] = useState(false);
  const [copiedAdminSql, setCopiedAdminSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const internshipTableSql = `create table public.internships (
  id bigint generated always as identity not null,
  title text not null,
  school_code text not null, -- 'A' through 'P' (Sixteen Schools)
  school_name text not null, -- e.g. 'AI, Data Science & Analytics'
  duration_model text not null, -- e.g. 'Model B - Standard'
  duration_hours_months text not null, -- e.g. '120 hrs', '3–6 months'
  target_audience text null, -- e.g. 'UG students; curriculum internships'
  project_focus text null, -- e.g. 'Defined project + deliverables'
  location text not null default 'Remote',
  workplace_type text not null default 'Remote', -- 'Remote', 'Hybrid', 'Onsite'
  internship_type text not null default 'Full-time', -- 'Full-time', 'Part-time'
  stipend text not null default 'Unpaid',
  openings integer not null default 1,
  description text not null,
  requirements text null,
  responsibilities text null,
  skills text[] null,
  deadline date null,
  status text not null default 'active', -- 'active', 'draft', 'closed'
  created_by bigint null references public.admins(id) on delete set null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint internships_pkey primary key (id)
) TABLESPACE pg_default;

-- Optional: Enable RLS and allow full operations with publishable key
alter table public.internships enable row level security;
create policy "Allow all operations for internships"
on public.internships for all using (true) with check (true);`;

  const adminTableSql = `create table public.admins (
  id bigint generated always as identity not null,
  name text not null,
  email text not null,
  password text not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email)
) TABLESPACE pg_default;`;

  // Init
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

        await Promise.all([fetchInternships(), fetchAdmins()]);
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
    const school = MBT_SCHOOLS.find((s) => s.code === code);
    setFormData((prev) => ({
      ...prev,
      school_code: code,
      school_name: school ? school.name : prev.school_name,
    }));
  };

  // Helper when changing Duration Model in form
  const handleModelChange = (modelName: string) => {
    const model = MBT_DURATION_MODELS.find(
      (m) => `${m.model} - ${m.title}` === modelName || m.model === modelName
    );
    if (model) {
      setFormData((prev) => ({
        ...prev,
        duration_model: `${model.model} - ${model.title}`,
        duration_hours_months: model.duration,
        target_audience: model.suitableFor,
        project_focus: model.focus,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        duration_model: modelName,
      }));
    }
  };

  // Open Add Modal
  const openAddModal = (prefillSchoolCode?: string) => {
    const initialSchool = prefillSchoolCode
      ? MBT_SCHOOLS.find((s) => s.code === prefillSchoolCode)
      : MBT_SCHOOLS[1];

    setFormData({
      ...emptyInternshipForm,
      school_code: initialSchool?.code || "B",
      school_name: initialSchool?.name || "AI, Data Science & Analytics",
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: Internship) => {
    setSelectedInternship(item);
    setFormData({
      title: item.title,
      school_code: item.school_code || "A",
      school_name: item.school_name || "Technology & Digital Innovation",
      duration_model: item.duration_model || "Model B - Standard",
      duration_hours_months: item.duration_hours_months || "120 hrs",
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
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (item: Internship) => {
    setSelectedInternship(item);
    setIsViewModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (item: Internship) => {
    setSelectedInternship(item);
    setIsDeleteModalOpen(true);
  };

  // Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError("Role Title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Description is required.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create internship.");
      }

      setIsAddModalOpen(false);
      await fetchInternships();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setFormError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
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
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update internship.");
      }

      setIsEditModalOpen(false);
      await fetchInternships();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setFormError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Submit
  const handleDeleteSubmit = async () => {
    if (!selectedInternship) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/internships?id=${selectedInternship.id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete internship.");
      }

      setIsDeleteModalOpen(false);
      await fetchInternships();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Status Toggle
  const handleQuickStatusToggle = async (item: Internship) => {
    const nextStatus =
      item.status === "active"
        ? "closed"
        : item.status === "closed"
        ? "draft"
        : "active";
    try {
      await fetch("/api/admin/internships", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
      await fetchInternships();
    } catch (err) {
      console.error("Status toggle error:", err);
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
      (item.school_name &&
        item.school_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location &&
        item.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesSchool =
      schoolFilter === "all" || item.school_code === schoolFilter;
    const matchesModel =
      modelFilter === "all" ||
      (item.duration_model && item.duration_model.startsWith(modelFilter));
    const matchesWorkplace =
      workplaceFilter === "all" || item.workplace_type === workplaceFilter;

    return matchesSearch && matchesStatus && matchesSchool && matchesModel && matchesWorkplace;
  });

  const activeCount = internships.filter((i) => i.status === "active").length;
  const draftCount = internships.filter((i) => i.status === "draft").length;
  const totalOpenings = internships.reduce(
    (sum, i) => sum + (Number(i.openings) || 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium tracking-wide">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1px] flex items-center justify-center shadow-md shadow-emerald-500/10">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">
                  MBT Internship Portal
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  16 SCHOOLS &bull; 5 MODELS
                </span>
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                tsytoncpwouudlrvwyew.supabase.co
              </span>
            </div>
          </div>

          {/* Right User Bar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-slate-800">{currentUser?.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{currentUser?.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
        {/* Table Not Created Notice */}
        {tableNotCreated && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Supabase Table <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">public.internships</code> Not Found
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  Run the SQL schema below in your Supabase SQL Editor to support the 16 Schools & 5 Duration Tracks.
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

        {/* Tab Navigation & Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("internships")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "internships"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Internship Postings</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "internships"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {internships.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("programme_structure")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "programme_structure"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Programme Structure (16 Schools & 5 Models)</span>
            </button>

            <button
              onClick={() => setActiveTab("admins")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "admins"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admins</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "admins"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {admins.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("schema")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "schema"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>PostgreSQL Schema</span>
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Internship</span>
          </button>
        </div>

        {/* TAB 1: INTERNSHIPS LIST & MANAGEMENT */}
        {activeTab === "internships" && (
          <div className="space-y-6">
            {/* Overview Stats */}
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
                  <span className="text-xs text-slate-500">internships</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Across 16 Schools</p>
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
                  <span className="text-xs text-slate-500">accepting applications</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Live opportunities</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Openings
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {totalOpenings}
                  </span>
                  <span className="text-xs text-slate-500">seats available</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Total student capacity</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Schools Represented
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {new Set(internships.map((i) => i.school_code)).size}
                  </span>
                  <span className="text-xs text-slate-500">of 16 Schools</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Schools A through P</p>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              {/* Filter Toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by role title, school, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* School Filter */}
                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-600 transition-all font-medium cursor-pointer"
                  >
                    <option value="all">All Schools (A–P)</option>
                    {MBT_SCHOOLS.map((s) => (
                      <option key={s.code} value={s.code}>
                        School {s.code}: {s.name}
                      </option>
                    ))}
                  </select>

                  {/* Duration Model Filter */}
                  <select
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-600 transition-all font-medium cursor-pointer"
                  >
                    <option value="all">All Duration Tracks</option>
                    {MBT_DURATION_MODELS.map((m) => (
                      <option key={m.model} value={m.model}>
                        {m.model}: {m.title} ({m.duration})
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-600 transition-all font-medium cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>

                  {/* Workplace Filter */}
                  <select
                    value={workplaceFilter}
                    onChange={(e) => setWorkplaceFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-600 transition-all font-medium cursor-pointer"
                  >
                    <option value="all">All Workplaces</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>

                  {/* Refresh */}
                  <button
                    onClick={fetchInternships}
                    disabled={refreshing}
                    title="Refresh data"
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-xs"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        refreshing ? "animate-spin text-emerald-600" : ""
                      }`}
                    />
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
                        <td
                          colSpan={8}
                          className="px-6 py-14 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Briefcase className="w-8 h-8 text-slate-300" />
                            <p className="font-medium text-slate-600">
                              {tableNotCreated
                                ? "Table 'public.internships' is not yet created in Supabase."
                                : searchQuery ||
                                  statusFilter !== "all" ||
                                  schoolFilter !== "all" ||
                                  modelFilter !== "all" ||
                                  workplaceFilter !== "all"
                                ? "No internships matched your search or filters."
                                : "No internships created yet."}
                            </p>
                            {!tableNotCreated && (
                              <button
                                onClick={() => openAddModal()}
                                className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                              >
                                Create First MBT Internship
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredInternships.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-slate-400">
                            #{item.id}
                          </td>

                          {/* School Badge */}
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                              <span className="w-4 h-4 rounded bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                                {item.school_code || "A"}
                              </span>
                              <span className="truncate max-w-[160px]">
                                {item.school_name || "General"}
                              </span>
                            </div>
                          </td>

                          {/* Title */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              Stipend: <span className="text-emerald-700 font-semibold">{item.stipend}</span>
                            </div>
                          </td>

                          {/* Duration Model */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.duration_model || "Standard"}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {item.duration_hours_months || "120 hrs"}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-slate-800">
                                {item.internship_type}
                              </span>
                              <span className="text-slate-300">&bull;</span>
                              <span className="text-slate-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {item.workplace_type} ({item.location})
                              </span>
                            </div>
                          </td>

                          {/* Openings */}
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-700 border border-slate-200 text-[11px]">
                              {item.openings} {item.openings === 1 ? "seat" : "seats"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleQuickStatusToggle(item)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                                item.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : item.status === "draft"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
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
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openViewModal(item)}
                                title="View details"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(item)}
                                title="Edit internship"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                title="Delete internship"
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

        {/* TAB 2: PROGRAMME STRUCTURE (16 SCHOOLS & 5 DURATION MODELS) */}
        {activeTab === "programme_structure" && (
          <div className="space-y-8">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-100 rounded-3xl p-6 sm:p-8">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-emerald-200">
                MBT Internship & Young Professional Programme
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Proposed Programme Structure & Tracks
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-3xl">
                Sixteen specialized internship schools spanning every functional discipline, mapped to five flexible duration models matched to student stage and university commitment.
              </p>
            </div>

            {/* 16 Schools Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    Sixteen Internship Schools (A through P)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any school card to immediately draft an internship opening in that discipline
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {MBT_SCHOOLS.map((school) => {
                  const countInSchool = internships.filter(
                    (i) => i.school_code === school.code
                  ).length;

                  return (
                    <div
                      key={school.code}
                      onClick={() => openAddModal(school.code)}
                      className="bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-extrabold text-xs flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            {school.code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {countInSchool} {countInSchool === 1 ? "opening" : "openings"}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs leading-snug group-hover:text-emerald-700 transition-colors">
                          {school.name}
                        </h4>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>+ Add opening</span>
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5 Duration Models Section */}
            <div>
              <div className="mb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  Internship Duration Models (Five Tracks)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Five tracks matched to student academic stage and institutional commitment
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {MBT_DURATION_MODELS.map((model) => (
                  <div
                    key={model.model}
                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 block">
                        {model.model}
                      </span>
                      <h4 className="text-lg font-extrabold tracking-tight mt-0.5">
                        {model.title}
                      </h4>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4 text-xs">
                      <div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                          {model.duration}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1 block">
                          Commitment
                        </span>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Suitable For
                          </span>
                          <p className="text-slate-700 text-xs leading-relaxed font-medium">
                            {model.suitableFor}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Core Focus
                          </span>
                          <p className="text-slate-600 text-xs leading-relaxed">
                            {model.focus}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMINS DIRECTORY */}
        {activeTab === "admins" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Active Admin Accounts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stored in PostgreSQL table <code className="font-mono text-emerald-700">public.admins</code>
                </p>
              </div>

              <button
                onClick={fetchAdmins}
                className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Admin Name</th>
                    <th className="px-6 py-3.5">Email Address</th>
                    <th className="px-6 py-3.5">Created At</th>
                    <th className="px-6 py-3.5 text-right">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {admins.map((admin) => {
                    const isSelf = currentUser?.id === admin.id;
                    const dateFormatted = admin.created_at
                      ? new Date(admin.created_at).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Recently";

                    return (
                      <tr
                        key={admin.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isSelf ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-slate-500">
                          #{admin.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                              {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {admin.name}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateFormatted}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active Admin
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

        {/* TAB 4: DATABASE SCHEMA & SQL DEFINITIONS */}
        {activeTab === "schema" && (
          <div className="space-y-6">
            {/* Supabase Endpoint */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Supabase Project Endpoint
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Connected via PostgREST and authenticated using client publishable key.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800">
                <span>https://tsytoncpwouudlrvwyew.supabase.co</span>
                <button
                  onClick={() =>
                    copyText(
                      "https://tsytoncpwouudlrvwyew.supabase.co",
                      setCopiedUrl
                    )
                  }
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                  title="Copy URL"
                >
                  {copiedUrl ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Internships Schema */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      MBT Internships Table Schema (16 Schools & 5 Tracks)
                    </h3>
                    <p className="text-xs text-slate-500">
                      PostgreSQL schema for <code className="font-mono font-medium text-slate-700">public.internships</code>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyText(internshipTableSql, setCopiedInternshipSql)
                  }
                  className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer font-medium"
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

            {/* Admins Schema */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Admins Table Definition
                    </h3>
                    <p className="text-xs text-slate-500">
                      PostgreSQL schema for <code className="font-mono font-medium text-slate-700">public.admins</code>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyText(adminTableSql, setCopiedAdminSql)}
                  className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer font-medium"
                >
                  {copiedAdminSql ? (
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
                {adminTableSql}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: ADD INTERNSHIP ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  Create MBT Internship Opening
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select an MBT School and Duration Model
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* School & Duration Model Selectors */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* School Selector */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      Internship School (A–P) *
                    </label>
                    <select
                      value={formData.school_code}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none"
                    >
                      {MBT_SCHOOLS.map((s) => (
                        <option key={s.code} value={s.code}>
                          School {s.code}: {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration Model */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-teal-600" />
                      Duration Model Track *
                    </label>
                    <select
                      value={formData.duration_model}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none"
                    >
                      {MBT_DURATION_MODELS.map((m) => (
                        <option key={m.model} value={`${m.model} - ${m.title}`}>
                          {m.model} &bull; {m.title} ({m.duration})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Auto-filled Track Guidance Info */}
                <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200/60 space-y-1">
                  <div>
                    <strong className="text-slate-700">Suitable For:</strong>{" "}
                    {formData.target_audience}
                  </div>
                  <div>
                    <strong className="text-slate-700">Project Focus:</strong>{" "}
                    {formData.project_focus}
                  </div>
                </div>
              </div>

              {/* Title & Other Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Internship Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Research & Analytics Intern"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration Commitment *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.duration_hours_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_hours_months: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Workplace Type
                  </label>
                  <select
                    value={formData.workplace_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workplace_type: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / Kochi / Bangalore"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Stipend
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹15,000 / month, Performance-based, Unpaid"
                    value={formData.stipend}
                    onChange={(e) =>
                      setFormData({ ...formData, stipend: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Seats / Openings
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.openings}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        openings: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Key Skills (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, Analytics, React, Project Management"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role Description & Scope *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline projects, deliverables, learning objectives..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Requirements & Responsibilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Requirements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Educational background, prerequisites..."
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Responsibilities
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specific milestones, reporting structure..."
                    value={formData.responsibilities}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsibilities: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Publish Opening</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT INTERNSHIP ================= */}
      {isEditModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-600" />
                  Edit Internship #{selectedInternship.id}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update role details across School and Duration Model
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      Internship School (A–P)
                    </label>
                    <select
                      value={formData.school_code}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none"
                    >
                      {MBT_SCHOOLS.map((s) => (
                        <option key={s.code} value={s.code}>
                          School {s.code}: {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-600" />
                      Duration Model Track
                    </label>
                    <select
                      value={formData.duration_model}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none"
                    >
                      {MBT_DURATION_MODELS.map((m) => (
                        <option key={m.model} value={`${m.model} - ${m.title}`}>
                          {m.model} &bull; {m.title} ({m.duration})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Internship Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration Commitment
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.duration_hours_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_hours_months: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Workplace Type
                  </label>
                  <select
                    value={formData.workplace_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workplace_type: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Location City
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Stipend
                  </label>
                  <input
                    type="text"
                    value={formData.stipend}
                    onChange={(e) =>
                      setFormData({ ...formData, stipend: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Seats / Openings
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.openings}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        openings: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Key Skills
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Role Overview *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW INTERNSHIP ================= */}
      {isViewModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[10px]">
                    School {selectedInternship.school_code}: {selectedInternship.school_name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      selectedInternship.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedInternship.status === "draft"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {selectedInternship.status}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {selectedInternship.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {selectedInternship.workplace_type} ({selectedInternship.location})
                  </span>
                  <span>&bull;</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedInternship.stipend}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Track Info Banner */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {selectedInternship.duration_model} ({selectedInternship.duration_hours_months})
                </span>
                <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-full font-bold text-slate-700">
                  {selectedInternship.openings} Seats Available
                </span>
              </div>
              {selectedInternship.target_audience && (
                <div className="text-slate-600 text-[11px]">
                  <strong>Target Candidates:</strong> {selectedInternship.target_audience}
                </div>
              )}
              {selectedInternship.project_focus && (
                <div className="text-slate-600 text-[11px]">
                  <strong>Focus:</strong> {selectedInternship.project_focus}
                </div>
              )}
            </div>

            {/* Content Sections */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                  About The Opportunity
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedInternship.description}
                </div>
              </div>

              {selectedInternship.requirements && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Requirements
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedInternship.requirements}
                  </div>
                </div>
              )}

              {selectedInternship.responsibilities && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Responsibilities
                  </h4>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedInternship.responsibilities}
                  </div>
                </div>
              )}

              {selectedInternship.skills &&
                selectedInternship.skills.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedInternship.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6 text-xs text-slate-400">
              <span>
                Created: {new Date(selectedInternship.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedInternship);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {isDeleteModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Delete Internship Posting?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-800 font-semibold">
                "{selectedInternship.title}"
              </strong>{" "}
              (ID #{selectedInternship.id})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteSubmit}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-sm shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
