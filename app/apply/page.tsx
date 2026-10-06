"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  GraduationCap,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Briefcase,
  Lock,
  Building,
  Check,
  Info,
  Mail,
} from "lucide-react";
import {
  type Internship,
  type ProgrammeSchool,
  type DurationModel,
  DEFAULT_MBT_SCHOOLS,
  DEFAULT_DURATION_MODELS,
} from "@/lib/supabase";

export default function StudentApplyPage() {
  const [openPositions, setOpenPositions] = useState<Internship[]>([]);
  const [schools, setSchools] = useState<ProgrammeSchool[]>([]);
  const [tracks, setTracks] = useState<DurationModel[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("3rd Year / Penultimate Year");
  const [selectedSchoolCode, setSelectedSchoolCode] = useState("B");
  const [selectedDurationModel, setSelectedDurationModel] = useState("Model B - Standard");
  const [resumeUrl, setResumeUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [statementOfPurpose, setStatementOfPurpose] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState<number | null>(null);

  // Opening-specific locking
  const [selectedInternshipId, setSelectedInternshipId] = useState<number | null>(null);
  const [targetRoleTitle, setTargetRoleTitle] = useState<string | null>(null);
  const [isLockedFromOrigin, setIsLockedFromOrigin] = useState(false);

  // Load data & handle initial query params
  useEffect(() => {
    async function loadData() {
      try {
        const [internshipsRes, schoolsRes, tracksRes] = await Promise.all([
          fetch("/api/internships"),
          fetch("/api/admin/schools"),
          fetch("/api/admin/tracks"),
        ]);

        let loadedPositions: Internship[] = [];
        if (internshipsRes.ok) {
          const iData = await internshipsRes.json();
          // Show only open / active positions
          loadedPositions = (iData.internships || []).filter(
            (i: Internship) => !i.status || i.status === "active"
          );
          setOpenPositions(loadedPositions);
        }

        let loadedSchools = DEFAULT_MBT_SCHOOLS.map((s, idx) => ({ ...s, id: idx + 1, created_at: "" }));
        if (schoolsRes.ok) {
          const sData = await schoolsRes.json();
          if (sData.schools && sData.schools.length > 0) {
            loadedSchools = sData.schools;
          }
        }
        setSchools(loadedSchools);

        let loadedTracks = DEFAULT_DURATION_MODELS.map((m, idx) => ({ ...m, id: idx + 1, created_at: "" }));
        if (tracksRes.ok) {
          const tData = await tracksRes.json();
          if (tData.tracks && tData.tracks.length > 0) {
            loadedTracks = tData.tracks;
          }
        }
        setTracks(loadedTracks);

        // Check URL Query Parameters
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const idParam = params.get("internshipId");
          const roleParam = params.get("role");
          const schoolParam = params.get("school");
          const trackParam = params.get("track");

          if (idParam) {
            const idNum = Number(idParam);
            setSelectedInternshipId(idNum);
            setIsLockedFromOrigin(true);

            const matched = loadedPositions.find((p) => p.id === idNum);
            if (matched) {
              setTargetRoleTitle(matched.title);
              setSelectedSchoolCode(matched.school_code);
              setSelectedDurationModel(matched.duration_model);
            } else {
              if (roleParam) setTargetRoleTitle(roleParam);
              if (schoolParam) setSelectedSchoolCode(schoolParam.toUpperCase());
              if (trackParam) setSelectedDurationModel(trackParam);
            }
          } else if (loadedPositions.length > 0) {
            // User opened /apply directly: default to the first open position so Domain and Duration are auto-populated
            const firstPos = loadedPositions[0];
            setSelectedInternshipId(firstPos.id);
            setTargetRoleTitle(firstPos.title);
            setSelectedSchoolCode(firstPos.school_code);
            setSelectedDurationModel(firstPos.duration_model);
          }
        }
      } catch (err) {
        console.error("Error loading apply page data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  // When user selects a different open position from dropdown
  const handlePositionChange = (posId: number) => {
    setSelectedInternshipId(posId);
    const chosen = openPositions.find((p) => p.id === posId);
    if (chosen) {
      setTargetRoleTitle(chosen.title);
      setSelectedSchoolCode(chosen.school_code);
      setSelectedDurationModel(chosen.duration_model);
    }
  };

  const selectedSchool =
    schools.find((s) => s.code === selectedSchoolCode) ||
    schools.find((s) => s.code === "A") ||
    schools[0];

  const selectedTrack =
    tracks.find(
      (m) =>
        `${m.model_code} - ${m.title}` === selectedDurationModel ||
        selectedDurationModel.startsWith(m.model_code) ||
        selectedDurationModel.includes(m.title)
    ) || tracks[1] || tracks[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !college.trim() || !degree.trim()) {
      setError("Please fill in all required personal and academic information.");
      return;
    }

    if (openPositions.length > 0 && !selectedInternshipId) {
      setError("Please select an open internship position to proceed.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/applications/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internship_id: selectedInternshipId,
          role_title: targetRoleTitle,
          full_name: fullName,
          email,
          phone,
          college,
          degree,
          year_of_study: yearOfStudy,
          school_code: selectedSchool?.code || selectedSchoolCode || "A",
          school_name: selectedSchool?.name || "General",
          duration_model: selectedDurationModel,
          resume_url: resumeUrl,
          linkedin_url: linkedinUrl,
          statement_of_purpose: statementOfPurpose,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      setSubmittedAppId(data.applicationId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/mbt.svg" alt="Mission Better Tomorrow" className="h-9 w-auto object-contain" />
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-sm block leading-none">
                MBT Internship Portal
              </span>
              <span className="text-[10px] text-slate-400 font-semibold  tracking-wider block mt-1">
                Mission Better Tomorrow
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>


          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">
        {submittedAppId ? (
          /* Success Screen */
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 text-center max-w-xl mx-auto animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-bold  tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Registration Received
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 tracking-tight">
              Application Successfully Submitted!
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Thank you, <strong className="text-slate-800">{fullName}</strong>. Your application has been logged into the MBT Young Professional database.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold  text-[10px]">Reference Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">#MBT-APP-{submittedAppId}</span>
              </div>
              {targetRoleTitle && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Applied Role:</span>
                  <span className="font-bold text-slate-900">{targetRoleTitle}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Domain:</span>
                <span className="font-semibold text-slate-800">
                  Domain {selectedSchool?.code}: {selectedSchool?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Internship Duration:</span>
                <span className="font-semibold text-slate-800">{selectedDurationModel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Applicant Email:</span>
                <span className="font-mono text-slate-700">{email}</span>
              </div>
            </div>

            {/* Email Notification Alert Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs mb-6 text-left flex items-start gap-3 shadow-2xs">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Confirmation Email Dispatched</p>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  We have sent an automated acknowledgment to <strong>{email}</strong> confirming receipt of your application. Our domain coordinators and mentors will review your credentials and reach out with updates.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-600/20"
              >
                Return to Homepage
              </Link>
              <button
                onClick={() => {
                  setSubmittedAppId(null);
                  setFullName("");
                  setEmail("");
                  setPhone("");
                  setCollege("");
                  setDegree("");
                  setResumeUrl("");
                  setLinkedinUrl("");
                  setStatementOfPurpose("");
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        ) : (
          /* Application Form */
          <div className="space-y-8">
            {/* Header Banner */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                MBT Internship & Young Professional Programme
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Apply for Internship @ MBT
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Join Mission Better Tomorrow (MBT). Choose from our open positions across 16 specialized Domains. Each role has a designated Domain and fixed Duration framework.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Unable to submit application</p>
                  <p className="text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Arrived from Specific Opening: Prominent Locked Banner */}
            {isLockedFromOrigin && targetRoleTitle && (
              <div className="max-w-3xl mx-auto p-4 sm:p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]  font-bold tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                        Selected Role
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                        <Lock className="w-3 h-3 text-emerald-700" />
                        Domain & Duration Locked
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1">
                      {targetRoleTitle}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Domain: <strong>{selectedSchool?.name || selectedSchoolCode}</strong> &bull; Duration:{" "}
                      <strong>{selectedDurationModel}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <Link
                    href="/#openings"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Browse All Openings</span>
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-xs">
              {/* Section 1: Candidate Details */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900  tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Applicant Information
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">Please provide your personal contact details</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Education */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900  tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                    Academic Background
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">Your current university or educational status</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                      College / Institution *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. University of Delhi / NIT"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                      Degree / Major *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech Computer Science, MSW"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                      Current Year of Study *
                    </label>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none cursor-pointer"
                    >
                      <option value="1st Year">1st Year Undergraduate</option>
                      <option value="2nd Year">2nd Year Undergraduate</option>
                      <option value="3rd Year">3rd Year Undergraduate</option>
                      <option value="4th Year">4th Year Undergraduate</option>
                      <option value="PG 1st Year">1st Year Post-Graduate</option>
                      <option value="PG 2nd Year">2nd Year Post-Graduate</option>
                      <option value="Recent Graduate">Recent Graduate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Open Position, Domain & Internship Duration */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900  tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                      Open Position Selection
                    </h2>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Select an active open position to view its assigned Domain and Duration.
                    </p>
                  </div>
                </div>

                {/* 1. Open Position Selector */}
                <div>
                  <label className="block font-semibold text-slate-700  tracking-wider mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      Select Open Position ({openPositions.length} active roles) *
                    </span>
                    {isLockedFromOrigin && (
                      <span className="text-[10px] text-emerald-700 font-bold  tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked from opening link
                      </span>
                    )}
                  </label>

                  {isLockedFromOrigin ? (
                    <div className="w-full bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold flex items-center justify-between cursor-not-allowed">
                      <span className="truncate">{targetRoleTitle || "Selected Internship Role"}</span>
                      <span className="text-[10px]  font-bold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded shrink-0 ml-2">
                        Locked
                      </span>
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedInternshipId || ""}
                      onChange={(e) => handlePositionChange(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none cursor-pointer"
                    >
                      {openPositions.length === 0 ? (
                        <option value="">No open positions currently available</option>
                      ) : (
                        openPositions.map((pos) => (
                          <option key={pos.id} value={pos.id}>
                            {pos.title} 
                          </option>
                        ))
                      )}
                    </select>
                  )}

                  {/* Below selected position: show Domain and Duration details cleanly */}
                  {selectedInternshipId && (
                    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold  tracking-wider text-emerald-800 block">
                              Assigned Domain
                            </span>
                            <span className="font-bold text-slate-900 text-xs block mt-0.5">
                              Domain {selectedSchool?.code}: {selectedSchool?.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {selectedSchool?.description || "Structured functional discipline with assigned mentors."}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold  tracking-wider text-teal-800 block">
                              Internship Duration
                            </span>
                            <span className="font-bold text-slate-900 text-xs block mt-0.5">
                              {selectedDurationModel} {selectedTrack?.duration ? `(${selectedTrack.duration})` : ""}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {selectedTrack?.focus || "Defined project milestones & deliverables."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Profile & Motivation */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900  tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                    Profile Links & Statement of Purpose
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">Showcase your skills and why you want to contribute</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                      Resume / Portfolio Link (Google Drive / GitHub)
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or https://github.com/..."
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700  tracking-wider mb-1.5">
                    Why do you want to join MBT? (Statement of Purpose)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe your interests, previous projects, or what you hope to achieve during this programme..."
                    value={statementOfPurpose}
                    onChange={(e) => setStatementOfPurpose(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-slate-500">
                  By submitting, you confirm the accuracy of the provided academic credentials.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Internship Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        MBT Internship & Young Professional Programme &bull; Mission Better Tomorrow
      </footer>
    </div>
  );
}
