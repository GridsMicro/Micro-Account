"use client";

import { formatDateInput, formatDateDisplay } from "@/lib/dateFormatter";
import { Calendar } from "lucide-react";
import { useState } from "react";

interface ThaiDateInputProps {
  value: string; // ISO format (yyyy-MM-dd)
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  showLabel?: boolean;
}

export default function ThaiDateInput({
  value,
  onChange,
  label,
  required = false,
  className = "",
  showLabel = true,
}: ThaiDateInputProps) {
  const [inputValue, setInputValue] = useState(value ? formatDateDisplay(value) : "");
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);

    // Try to parse if user enters dd/mm/yyyy format
    if (text.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parts = text.split("/");
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const dateObj = new Date(year, month - 1, day);
        if (dateObj.getDate() === day && dateObj.getMonth() === month - 1) {
          onChange(formatDateInput(dateObj));
        }
      }
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    onChange(isoDate);
    setInputValue(isoDate ? formatDateDisplay(isoDate) : "");
  };

  return (
    <div className="space-y-1 relative">
      {showLabel && label && (
        <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Calendar size={10} /> {label}
        </label>
      )}

      <div className="flex gap-2">
        {/* Text input for dd/mm/yyyy display */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="dd/mm/yyyy"
          className={`flex-1 h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-rose-400 ${className}`}
        />

        {/* Hidden native date input */}
        <input
          type="date"
          value={value}
          onChange={handleDateInputChange}
          required={required}
          className="hidden"
        />

        {/* Calendar icon button to open native picker */}
        <button
          type="button"
          onClick={() => {
            // Trigger the hidden date input click
            const hiddenInput = document.querySelector(
              'input[type="date"]:not(.hidden)'
            ) as HTMLInputElement | null;
            if (hiddenInput) hiddenInput.click();
          }}
          className="h-11 w-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:text-rose-500 hover:border-rose-300 flex items-center justify-center transition-all"
        >
          <Calendar size={18} />
        </button>
      </div>

      <p className="text-[9px] text-slate-400">รูปแบบ: dd/mm/yyyy</p>
    </div>
  );
}
