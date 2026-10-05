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
} from "lucide-react";
import {
  type ProgrammeSchool,
  type DurationModel,
  DEFAULT_MBT_SCHOOLS,
  DEFAULT_DURATION_MODELS,
} from "@/lib/supabase";

export default function StudentApplyPage() {
  const [schools, setSchools] = useState<ProgrammeSchool[]>([]);
  const [tracks, setTracks] = useState<DurationModel[]>([]);

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

  // Load active schools and tracks
  useEffect(() => {
    async function loadData() {
      try {
        const [schoolsRes, tracksRes] = await Promise.all([
          fetch("/api/admin/schools"),
          fetch("/api/admin/tracks"),
        ]);

        if (schoolsRes.ok) {
          const sData = await schoolsRes.json();
          setSchools(sData.schools || []);
        } else {
          setSchools(
            DEFAULT_MBT_SCHOOLS.map((s, idx) => ({ ...s, id: idx + 1, created_at: "" }))
          );
        }

        if (tracksRes.ok) {
          const tData = await tracksRes.json();
          setTracks(tData.tracks || []);
        } else {
          setTracks(
            DEFAULT_DURATION_MODELS.map((m, idx) => ({ ...m, id: idx + 1, created_at: "" }))
          );
        }
      } catch (err) {
        setSchools(
          DEFAULT_MBT_SCHOOLS.map((s, idx) => ({ ...s, id: idx + 1, created_at: "" }))
        );
        setTracks(
          DEFAULT_DURATION_MODELS.map((m, idx) => ({ ...m, id: idx + 1, created_at: "" }))
        );
      }
    }

    loadData();
  }, []);

  const selectedSchool = schools.find((s) => s.code === selectedSchoolCode) || schools[0];
  const selectedTrack =
    tracks.find((m) => `${m.model_code} - ${m.title}` === selectedDurationModel) || tracks[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !college.trim() || !degree.trim()) {
      setError("Please fill in all required personal and academic information.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/applications/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          college,
          degree,
          year_of_study: yearOfStudy,
          school_code: selectedSchool?.code || "A",
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
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1px] flex items-center justify-center shadow-md shadow-emerald-500/10">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-sm">
                MBT Internship Programme
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Student Portal
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

            <Link
              href="/admin/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Admin Portal
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

            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Registration Received
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Application Successfully Submitted!
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Thank you, <strong className="text-slate-800">{fullName}</strong>. Your application has been logged into the MBT Young Professional database.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Reference Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">#MBT-APP-{submittedAppId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Selected School:</span>
                <span className="font-semibold text-slate-800">
                  School {selectedSchool?.code}: {selectedSchool?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Duration Track:</span>
                <span className="font-semibold text-slate-800">{selectedDurationModel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Applicant Email:</span>
                <span className="font-mono text-slate-700">{email}</span>
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
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Apply for MBT Internship
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Join our 16 specialized Schools across digital, research, leadership, and community development. Select your preferred discipline and duration track below.
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

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-xs">
              {/* Section 1: Candidate Details */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Applicant Information
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">Please provide your personal contact details</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      College / University Institution *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Model Engineering College, CUSAT"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Degree & Major *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech Computer Science / BBA / MBA"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Current Academic Stage
                    </label>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none font-medium cursor-pointer"
                    >
                      <option value="1st Year">1st Year Undergraduate</option>
                      <option value="2nd Year">2nd Year Undergraduate</option>
                      <option value="3rd Year / Penultimate Year">3rd Year / Penultimate Year</option>
                      <option value="Final Year">Final Year Undergraduate</option>
                      <option value="Post-Graduate / Masters">Post-Graduate / Masters</option>
                      <option value="Recent Graduate">Recent Graduate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Programme Selection */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                    Discipline & Duration Model Selection
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">Matched to your interests and institutional requirements</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select School */}
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      Internship School (A through P) *
                    </label>
                    <select
                      value={selectedSchoolCode}
                      onChange={(e) => setSelectedSchoolCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none cursor-pointer"
                    >
                      {schools.map((s) => (
                        <option key={s.id} value={s.code}>
                          School {s.code}: {s.name}
                        </option>
                      ))}
                    </select>

                    {selectedSchool && (
                      <div className="mt-2 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-[11px] space-y-0.5">
                        <span className="font-bold block">School {selectedSchool.code} &bull; {selectedSchool.name}</span>
                        <span className="text-teal-700 block">{selectedSchool.description || "Active professional training track with mentorship."}</span>
                      </div>
                    )}
                  </div>

                  {/* Select Track */}
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-teal-600" />
                      Internship Duration Track *
                    </label>
                    <select
                      value={selectedDurationModel}
                      onChange={(e) => setSelectedDurationModel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none cursor-pointer"
                    >
                      {tracks.map((m) => (
                        <option key={m.id} value={`${m.model_code} - ${m.title}`}>
                          {m.model_code} &bull; {m.title} ({m.duration})
                        </option>
                      ))}
                    </select>

                    {selectedTrack && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{selectedTrack.model_code}: {selectedTrack.title}</span>
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {selectedTrack.duration}
                          </span>
                        </div>
                        <p className="text-slate-600"><strong>Suitable:</strong> {selectedTrack.suitable_for}</p>
                        <p className="text-slate-600"><strong>Focus:</strong> {selectedTrack.focus}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Profile & Motivation */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                    Profile Links & Statement of Purpose
                  </h2>
                  <p className="text-slate-500 text-[11px] mt-0.5">Showcase your skills and why you want to contribute</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
