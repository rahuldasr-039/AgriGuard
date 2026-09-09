"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TesterWasteRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tester?tab=waste");
  }, [router]);

  return (
    <div className="p-8 text-slate-400 flex items-center gap-3">
      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      <span>Loading Waste &amp; Compensation...</span>
    </div>
  );
}
