"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle, Mail, Send } from "lucide-react";

/**
 * Forgot-password request page (added 2026-11-19).
 * Connected from the previously inactive "ลืมรหัสผ่าน?" button on /login.
 * The API deliberately returns the same message for known/unknown emails.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่");
      } else {
        setMessage(data.message || "ส่งลิงก์ตั้งรหัสผ่านแล้ว กรุณาตรวจสอบอีเมล");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด: " + (err instanceof Error ? err.message : "กรุณาลองใหม่"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded shadow-md border-t-4 border-blue-600 p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">ลืมรหัสผ่าน</h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          กรอกอีเมลที่ใช้เข้าสู่ระบบ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-xs font-medium">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded flex gap-3">
            <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 text-xs font-medium">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder="อีเมลที่ใช้เข้าสู่ระบบ"
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium disabled:opacity-50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black rounded shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:cursor-not-allowed"
          >
            <Send size={18} />
            {isLoading ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่าน"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link href="/login" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2 text-xs">
            <ArrowLeft size={14} /> กลับสู่หน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </main>
  );
}
