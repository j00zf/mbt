import Link from "next/link";
import {
  ShieldCheck,
  Database,
  ArrowRight,
  UserPlus,
  LogIn,
  LayoutDashboard,
  Lock,
  Server,
  Code2,
} from "lucide-react";

export default function Home() {
  const schemaSql = `create table public.admins (
  id bigint generated always as identity not null,
  name text not null,
  email text not null,
  password text not null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email)
) TABLESPACE pg_default;`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1px] flex items-center justify-center shadow-md shadow-emerald-500/10">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base">
                Admin Management Portal
              </span>
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Supabase Connected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/admin/register"
              className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20"
            >
              Register Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center relative">
        {/* Soft Ambient Background Elements */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-emerald-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Supabase Project: <code className="font-mono text-slate-800 font-semibold">tsytoncpwouudlrvwyew</code>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Secure Admin Authentication &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
              Database Dashboard
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connected to Supabase PostgreSQL schema <code className="text-emerald-700 font-mono text-sm bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">public.admins</code>. Featuring salted bcrypt password hashing, secure sessions, registration, authentication, and a real-time admin directory dashboard.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admin Registration</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/admin/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold px-6 py-3.5 rounded-xl text-sm shadow-sm transition-all"
            >
              <LogIn className="w-4 h-4 text-emerald-600" />
              <span>Admin Sign In</span>
            </Link>

            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold px-6 py-3.5 rounded-xl text-sm shadow-sm transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-teal-600" />
              <span>Live Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="w-full max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left relative z-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Supabase PostgreSQL
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Connected with provided endpoint and publishable key to interface directly with the <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">public.admins</code> table.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Bcrypt Password Security
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Passwords are salted and securely hashed using standard Bcrypt before writing to the database, ensuring zero plain-text leaks.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Next.js 16 App Router
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Modern server-side cookies, full REST authentication endpoints, and responsive interactive client dashboard with real-time search.
            </p>
          </div>
        </div>

        {/* Schema SQL Showcase */}
        <div className="w-full max-w-4xl mt-12 bg-white border border-slate-200 rounded-2xl overflow-hidden text-left shadow-md">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-800">
                PostgreSQL Schema Definition
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
              public.admins
            </span>
          </div>
          <pre className="p-6 text-xs font-mono text-slate-800 bg-slate-900 text-emerald-400 overflow-x-auto leading-relaxed rounded-b-2xl">
            {schemaSql}
          </pre>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        Supabase Admin Integration &bull; Powered by Next.js & Supabase PostgreSQL
      </footer>
    </div>
  );
}
