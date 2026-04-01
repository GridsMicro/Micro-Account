"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex h-12 items-center gap-3 rounded-xl bg-violet-600 px-6 text-sm font-black text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-1 active:scale-95"
    >
      <Printer size={18} /> พิมพ์เอกสาร
    </button>
  );
}
