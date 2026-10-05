"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Database,
  KeyRound,
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
} from "lucide-react";

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

export default function AdminDashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Check authentication & load data
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

        await fetchAdmins();
      } catch (err) {
        console.error("Initialization error:", err);
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const fetchAdmins = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
    }
  };

  const schemaSql = `create table public.admins (
  id bigint generated always as identity not null,
  name text not null,
  email text not null,
  password text not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email)
) TABLESPACE pg_default;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText("https://tsytoncpwouudlrvwyew.supabase.co");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toString().includes(searchQuery)
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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
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
                  Admin Dashboard
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  LIVE
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
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-100/80 p-6 sm:p-8 shadow-sm">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-xs font-semibold text-emerald-800 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Supabase Connected &bull; PostgREST Ready
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {currentUser?.name || "Administrator"}
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Managing PostgreSQL table <code className="font-mono text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded font-medium">public.admins</code> with identity auto-increment, unique email constraints, and encrypted credentials.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/register"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Another Admin</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Admins
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {admins.length}
              </span>
              <span className="text-xs text-slate-500">accounts</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Stored in public.admins</p>
          </div>

          {/* Stat 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Supabase Instance
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate" title="tsytoncpwouudlrvwyew.supabase.co">
              tsytoncpwouudlrvwyew
            </p>
          </div>

          {/* Stat 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Security Scheme
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-base font-bold text-slate-900">Bcrypt 10 Rounds</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Salted & Hashed Passwords</p>
          </div>

          {/* Stat 4 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Role
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-base font-bold text-slate-900">Super Admin</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">ID #{currentUser?.id}</p>
          </div>
        </div>

        {/* Admins Table Section */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Table Header Controls */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Registered Administrators
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time admin records fetched directly from Supabase PostgreSQL
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 transition-all w-52 sm:w-64"
                />
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchAdmins}
                disabled={refreshing}
                title="Refresh admins list"
                className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
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
                  <th className="px-6 py-3.5">Admin Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Created At</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      {searchQuery
                        ? "No administrators match your search filter."
                        : "No administrators found in public.admins yet."}
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => {
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
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                {admin.name}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-medium">
                                    You
                                  </span>
                                )}
                              </div>
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
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database & Schema Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PostgreSQL Schema */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Database Table Definition</h3>
              </div>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 p-4 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed">
              {schemaSql}
            </pre>
          </div>

          {/* Connection Details */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Server className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Supabase Endpoint Config</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Supabase Project URL
                  </label>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800">
                    <span className="truncate mr-2">https://tsytoncpwouudlrvwyew.supabase.co</span>
                    <button
                      onClick={handleCopyUrl}
                      className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200 rounded transition-colors"
                      title="Copy URL"
                    >
                      {copiedUrl ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Client Key (Publishable / Anon)
                  </label>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800">
                    <span className="truncate">sb_publishable_WX46LzzPZzuLdz7G3jp0vQ_AAUcesCN</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Loaded
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Primary Key & Unique Constraints
                  </label>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div>&bull; Primary Key: <code className="text-emerald-700 font-mono font-medium">admins_pkey (id)</code></div>
                    <div>&bull; Unique Key: <code className="text-emerald-700 font-mono font-medium">admins_email_key (email)</code></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Next.js App Router 16</span>
              <span>PostgreSQL 15 / Supabase</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
