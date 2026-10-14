"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Database,
  CheckCircle2,
  LockKeyhole,
  Home,
  LogIn,
  Loader2,
} from "lucide-react";
import { extractPhoneFromQuery } from "@/lib/security";

export default function AdminRegisterPage() {
  const router = useRouter();

  // Access authorization states
  const [authState, setAuthState] = useState<"checking" | "authorized" | "unauthorized">("checking");
  const [authError, setAuthError] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  // Form input states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form submission states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate URL query parameter on mount
  useEffect(() => {
    async function verifyUrlAuthorization() {
      if (typeof window === "undefined") return;

      const rawSearch = window.location.search || "";
      // Extract the unnamed query parameter (strictly rejecting ?phone=, ?key=, etc.)
      const extractedPhone = extractPhoneFromQuery(rawSearch);

      if (!extractedPhone) {
        setAuthState("unauthorized");
        setAuthError(
          "Admin registration is restricted. A valid authorized phone number must be provided directly in the URL query string (e.g. /admin/register?9876543210). Named query parameters like ?phone= are not accepted."
        );
        return;
      }

      try {
        const res = await fetch("/api/auth/register/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: extractedPhone }),
        });

        const data = await res.json();
        if (res.ok && data.authorized) {
          setPhone(data.phone || extractedPhone);
          setAuthState("authorized");
        } else {
          setAuthState("unauthorized");
          setAuthError(
            data.error ||
              "Access Denied: The telephone number in this link is not authorized for administrator registration."
          );
        }
      } catch {
        setAuthState("unauthorized");
        setAuthError(
          "Unable to verify authorization at this moment. Please check your connection and try again."
        );
      }
    }

    verifyUrlAuthorization();
  }, []);

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 25;
    if (password.length >= 10) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9!@#$%^&*]/.test(password)) score += 25;
    return score;
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone) {
      setError("Authorized phone number is missing from this session.");
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setError("Please enter your full name (minimum 2 characters).");
      return;
    }

    // Client-side XSS & SQL Injection checks
    if (/[<>'";\0]/.test(cleanName) || /(union\s+select|--|\/\*)/i.test(cleanName)) {
      setError("Name contains forbidden or suspicious characters.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (/[<>'";\0]/.test(cleanEmail) || /(union\s+select|--|\/\*)/i.test(cleanEmail)) {
      setError("Email contains forbidden or suspicious characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password.includes("\0")) {
      setError("Password contains invalid characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register admin.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login?registered=pending");
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading / Verification State
  if (authState === "checking") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-100/70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-100/70 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 text-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-200/60 flex flex-col items-center">
            <div className="mb-6">
              <img src="/mbt.svg" alt="Mission Better Tomorrow" className="h-12 w-auto object-contain" />
            </div>
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-900">Verifying Authorization</h2>
            <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
              Validating administrator invite credentials and security parameters...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthorized / Access Denied State
  if (authState === "unauthorized") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-100/70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-100/70 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="mb-4">
              <img src="/mbt.svg" alt="Mission Better Tomorrow" className="h-12 w-auto object-contain" />
            </div>
          </div>

          {/* Access Denied Card */}
          <div className="bg-white border border-rose-200 rounded-3xl p-8 shadow-xl shadow-rose-200/30 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Access Restricted
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 mt-1">
              403 Forbidden &bull; Authorization Required
            </p>

            <div className="my-6 p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-left text-xs text-rose-900 leading-relaxed">
              <p className="font-semibold text-rose-950 mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Invitation Verification Failed
              </p>
              {authError}
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Administrator registration requires an authorized invite URL with your pre-approved telephone number. If you are an authorized MBT staff member, please request a valid registration link from your system administrator.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </Link>
              <Link
                href="/admin/login"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Admin Sign In
              </Link>
            </div>
          </div>

          {/* Security footnote */}
          <div className="mt-6 text-center text-xs text-slate-400">
            MBT Security Gate &bull; Parameter-Free Authorization Protocol
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized State - Registration Form
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-100/70 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-100/70 rounded-full blur-3xl pointer-events-none" />

      {/* Main card container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4">
            <img src="/mbt.svg" alt="Mission Better Tomorrow" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Admin Registration
          </h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Authorized Invite Verified
            </span>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <code className="text-xs bg-slate-100 text-emerald-700 px-2 py-0.5 rounded font-mono font-medium border border-slate-200">public.admins</code>
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/60">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Registration Failed</p>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-950">Registration Submitted!</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Your admin account is created with <strong>Inactive</strong> status. Another active administrator must approve and activate your account before you can log in.
                </p>
                <p className="text-[11px] text-amber-700 font-medium mt-1">Redirecting to login portal...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Alexandra Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone Number (Extracted from URL, Read-Only, Verified) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Phone Number
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <LockKeyhole className="w-3 h-3 text-emerald-600" />
                  Locked &bull; Verified
                </span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                <input
                  id="phone"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={phone}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-800 font-mono font-medium rounded-xl pl-10 pr-10 py-2.5 text-sm cursor-not-allowed select-none outline-none focus:ring-0"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Extracted from your authorization link and saved to your administrator profile.
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength <= 25
                          ? "w-1/4 bg-rose-500"
                          : strength <= 50
                            ? "w-2/4 bg-amber-500"
                            : strength <= 75
                              ? "w-3/4 bg-blue-500"
                              : "w-full bg-emerald-500"
                        }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {strength <= 25 && "Weak password"}
                    {strength > 25 && strength <= 50 && "Fair password"}
                    {strength > 50 && strength <= 75 && "Good password"}
                    {strength > 75 && "Strong password"}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50/60 hover:bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Admin...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registered!</span>
                </>
              ) : (
                <>
                  <span>Create Admin Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an admin account?{" "}
              <Link
                href="/admin/login"
                className="text-emerald-700 hover:text-emerald-800 font-semibold transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Database info footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Supabase PostgreSQL &bull; Table <span className="font-mono text-slate-700 font-medium">public.admins</span>
        </div>
      </div>
    </div>
  );
}
