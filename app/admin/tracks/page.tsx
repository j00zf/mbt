"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TracksPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard?tab=tracks");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-base font-bold text-slate-900">Loading 5 Duration Models...</h2>
      <p className="text-xs text-slate-500 mt-1">Directing to Admin Programme Management</p>
    </div>
  );
}
