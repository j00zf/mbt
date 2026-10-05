"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Target,
  ArrowRight,
  Search,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  X,
  Calendar,
  Layers,
  Building,
  Filter,
  Eye,
  Check,
  ChevronRight,
  Tag,
  Share2,
} from "lucide-react";
import {
  type Internship,
  type ProgrammeSchool,
  type DurationModel,
  DEFAULT_MBT_SCHOOLS,
  DEFAULT_DURATION_MODELS,
} from "@/lib/supabase";

export default function HomePage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [schools, setSchools] = useState<ProgrammeSchool[]>([]);
  const [tracks, setTracks] = useState<DurationModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedWorkplace, setSelectedWorkplace] = useState("all");

  // Selected Internship Modal
  const [activeModalInternship, setActiveModalInternship] = useState<Internship | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [internshipsRes, schoolsRes, tracksRes] = await Promise.all([
          fetch("/api/internships"),
          fetch("/api/admin/schools"),
          fetch("/api/admin/tracks"),
        ]);

        if (internshipsRes.ok) {
          const data = await internshipsRes.json();
          setInternships(data.internships || []);
        }

        if (schoolsRes.ok) {
          const data = await schoolsRes.json();
          setSchools(data.schools || []);
        } else {
          setSchools(
            DEFAULT_MBT_SCHOOLS.map((s, idx) => ({ ...s, id: idx + 1, created_at: "" }))
          );
        }

        if (tracksRes.ok) {
          const data = await tracksRes.json();
          setTracks(data.tracks || []);
        } else {
          setTracks(
            DEFAULT_DURATION_MODELS.map((m, idx) => ({ ...m, id: idx + 1, created_at: "" }))
          );
        }
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter internships
  const filteredInternships = internships.filter((item) => {
    // Only show active roles on public site
    if (item.status && item.status !== "active") return false;

    const q = searchQuery.toLowerCase();
    const skillsString = Array.isArray(item.skills)
      ? item.skills.join(" ")
      : String(item.skills || "");

    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.school_name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      skillsString.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q));

    const matchesSchool =
      selectedSchool === "all" || item.school_code === selectedSchool;

    const matchesTrack =
      selectedTrack === "all" ||
      (item.duration_model && item.duration_model.startsWith(selectedTrack));

    const matchesWorkplace =
      selectedWorkplace === "all" || item.workplace_type === selectedWorkplace;

    return matchesSearch && matchesSchool && matchesTrack && matchesWorkplace;
  });

  const totalSeats = internships.reduce((sum, i) => sum + (Number(i.openings) || 0), 0);

  const handleSharePosting = (item: Internship) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/?postingId=${item.id}#openings`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* =========================================================================
          TOP NAVBAR
      ========================================================================= */}
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/mbt.svg" alt="Mission Better Tomorrow" className="h-10 w-auto object-contain" />
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-none">
                MBT Internship Portal
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                Mission Better Tomorrow
              </span>
            </div>
          </div>



          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#openings" className="hover:text-emerald-700 transition-colors">
              Browse Openings ({internships.length})
            </a>
            <a href="#schools" className="hover:text-emerald-700 transition-colors">
              Domains
            </a>
            <a href="#tracks" className="hover:text-emerald-700 transition-colors">
              Internship Duration
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/apply"
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Apply for Internship</span>
            </Link>

            <Link
              href="/admin/login"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION
      ========================================================================= */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50 to-slate-50">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-emerald-100/60 to-teal-100/60 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Accepting Applications &bull; 16 Schools &bull; 5 Duration Models</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-[1.12]">
            Discover Your Next{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
              High-Impact Internship
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Explore live openings across 16 specialized discipline schools — from Artificial Intelligence and Design to Youth Development and Public Governance. Click any role to view detailed deliverables and register immediately.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-700 font-semibold">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span><strong>{internships.length}</strong> Live Openings</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <Building className="w-4 h-4 text-teal-600" />
              <span><strong>16</strong> Discipline Schools</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span><strong>5</strong> Duration Models</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <Users className="w-4 h-4 text-emerald-600" />
              <span><strong>{totalSeats}</strong> Total Seats</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#openings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>Explore All Openings</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              href="/apply"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold px-6 py-3.5 rounded-xl text-xs sm:text-sm shadow-2xs transition-all"
            >
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>General Student Application</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: INTERNSHIP OPENINGS BROWSER
      ========================================================================= */}
      <section id="openings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Briefcase className="w-4 h-4" />
              <span>Current Opportunities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Active Internship Postings
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Filter by school discipline, timeline track, or workplace format
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{filteredInternships.length}</strong> of {internships.length} openings
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by role title, required skill (e.g. Python, Figma), or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>

            {/* School Filter */}
            <div className="w-full lg:w-64">
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Schools (16 Disciplines)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.code}>
                    School {s.code}: {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Track Filter */}
            <div className="w-full lg:w-56">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Duration Tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.model_code}>
                    {t.model_code} ({t.duration})
                  </option>
                ))}
              </select>
            </div>

            {/* Workplace Filter */}
            <div className="w-full lg:w-44">
              <select
                value={selectedWorkplace}
                onChange={(e) => setSelectedWorkplace(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Workplaces</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            {(searchQuery || selectedSchool !== "all" || selectedTrack !== "all" || selectedWorkplace !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSchool("all");
                  setSelectedTrack("all");
                  setSelectedWorkplace("all");
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 shrink-0 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Internship Cards Grid */}
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-semibold">Loading live internship postings...</p>
          </div>
        ) : filteredInternships.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 max-w-md mx-auto space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">No matching internship openings</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search keywords, school filter, or track selections.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSchool("all");
                setSelectedTrack("all");
                setSelectedWorkplace("all");
              }}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map((item) => {
              const skillsList = Array.isArray(item.skills)
                ? item.skills
                : typeof item.skills === "string"
                  ? String(item.skills).split(",").map((s) => s.trim()).filter(Boolean)
                  : [];

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => setActiveModalInternship(item)}
                >
                  <div className="space-y-4">
                    {/* Top Row: School Tag & Workplace */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl">
                        School {item.school_code}: {item.school_name}
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {item.workplace_type}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Metadata Specs */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{item.duration_model}</span>
                        <span className="text-slate-400">({item.duration_hours_months})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.location || "Remote"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.openings} {item.openings === 1 ? "seat" : "seats"} available</span>
                        {item.stipend && (
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                            {item.stipend}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skills Pills */}
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {skillsList.slice(0, 3).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                        {skillsList.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                            +{skillsList.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTA Row */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalInternship(item);
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    <Link
                      href={`/apply?internshipId=${item.id}&role=${encodeURIComponent(item.title)}&school=${item.school_code}&track=${encodeURIComponent(item.duration_model)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION: 16 SCHOOLS DISCIPLINE ARCHITECTURE
      ========================================================================= */}
      <section id="schools" className="bg-white border-y border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Domains & Discipline Architecture
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              16 Specialized Domains (Schools Architecture)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every intern at MBT is mapped to one of 16 structured domain schools with designated mentors, live project briefs, and performance milestones. Click any domain below to view openings in that discipline.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
            {schools.map((school) => {
              const rolesCount = internships.filter((i) => i.school_code === school.code).length;
              return (
                <button
                  key={school.id}
                  onClick={() => {
                    setSelectedSchool(school.code);
                    const el = document.getElementById("openings");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${selectedSchool === school.code
                    ? "bg-emerald-50 border-emerald-300 shadow-xs"
                    : "bg-slate-50/70 hover:bg-slate-100/70 border-slate-200"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      {school.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {rolesCount} {rolesCount === 1 ? "role" : "roles"}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                    {school.name}
                  </h4>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: 5 DURATION MODELS (TRACKS)
      ========================================================================= */}
      <section id="tracks" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Commitment Frameworks
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Internship Duration (5 Tracks Models)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            From short curriculum internships to intensive 1-year innovation fellowships, students can choose the model fitting their university credits and career trajectory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                  {track.model_code}
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-2">{track.title}</h4>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">{track.duration}</div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Suitable For</span>
                    <p className="text-slate-700 text-xs mt-0.5 leading-snug">{track.suitable_for}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Project Scope</span>
                    <p className="text-slate-700 text-xs mt-0.5 leading-snug">{track.focus}</p>
                  </div>
                </div>
              </div>

              <Link
                href={`/apply?track=${encodeURIComponent(`${track.model_code} - ${track.title}`)}`}
                className="w-full text-center text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-2 rounded-xl transition-colors block border border-emerald-200"
              >
                Apply for {track.title}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          MODAL: FULL INTERNSHIP DETAILS & REGISTER BUTTON
      ========================================================================= */}
      {activeModalInternship && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative animate-scale-up">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg">
                    School {activeModalInternship.school_code}: {activeModalInternship.school_name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {activeModalInternship.workplace_type}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeModalInternship.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeModalInternship.location || "Remote"}</span>
                  <span>&bull;</span>
                  <span>{activeModalInternship.internship_type}</span>
                </p>
              </div>

              <button
                onClick={() => setActiveModalInternship(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-6 text-xs pt-4">
              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration Track</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {activeModalInternship.duration_model}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({activeModalInternship.duration_hours_months})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Available Seats</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {activeModalInternship.openings} {activeModalInternship.openings === 1 ? "seat" : "seats"}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Active role</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Stipend / Support</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {activeModalInternship.stipend || "Certificate & Perks"}
                  </span>
                  <span className="text-[11px] text-slate-500">Based on evaluation</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Application Deadline</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {activeModalInternship.deadline || "Rolling admissions"}
                  </span>
                  <span className="text-[11px] text-slate-500">Early apply recommended</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">About the Role & Project Brief</h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {activeModalInternship.description}
                </p>
              </div>

              {/* Responsibilities */}
              {activeModalInternship.responsibilities && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">Key Responsibilities</h4>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activeModalInternship.responsibilities}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {activeModalInternship.requirements && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">Eligibility & Requirements</h4>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {activeModalInternship.requirements}
                  </p>
                </div>
              )}

              {/* Required Skills */}
              {activeModalInternship.skills && activeModalInternship.skills.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Required Skills & Tools</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(activeModalInternship.skills)
                      ? activeModalInternship.skills
                      : String(activeModalInternship.skills).split(",")
                    ).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-800 font-semibold px-3 py-1 rounded-xl text-xs"
                      >
                        {String(skill).trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience / Focus */}
              {(activeModalInternship.target_audience || activeModalInternship.project_focus) && (
                <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-2xl space-y-1.5">
                  {activeModalInternship.target_audience && (
                    <p className="text-teal-900">
                      <strong>Recommended for:</strong> {activeModalInternship.target_audience}
                    </p>
                  )}
                  {activeModalInternship.project_focus && (
                    <p className="text-teal-900">
                      <strong>Deliverable Scope:</strong> {activeModalInternship.project_focus}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSharePosting(activeModalInternship)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Share Posting"}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModalInternship(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>

                <Link
                  href={`/apply?internshipId=${activeModalInternship.id}&role=${encodeURIComponent(activeModalInternship.title)}&school=${activeModalInternship.school_code}&track=${encodeURIComponent(activeModalInternship.duration_model)}`}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Register for this Posting</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FOOTER
      ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <img src="/mbt.svg" alt="Mission Better Tomorrow" className="h-9 w-auto object-contain" />
            <div>
              <span className="font-bold text-slate-900 block">Mission Better Tomorrow</span>
              <span className="text-[11px] text-slate-400">Youth Leadership & Academic Internship Framework</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/apply" className="hover:text-emerald-700 font-semibold">
              Student Registration
            </Link>
            <Link href="/admin/login" className="hover:text-emerald-700 font-semibold">
              Admin Login
            </Link>
            <Link href="/admin/register" className="hover:text-emerald-700 font-semibold">
              Register Admin
            </Link>
          </div>

          <div className="text-slate-400">
            &copy; {new Date().getFullYear()} Mission Better Tomorrow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
