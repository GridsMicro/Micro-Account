'use client';

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
      className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-md font-bold transition-all focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
    >
      <Printer size={18} /> พิมพ์เอกสาร (Print)
    </button>
  );
}
