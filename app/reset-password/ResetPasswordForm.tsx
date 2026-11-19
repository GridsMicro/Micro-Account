"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle, Lock } from "lucide-react";

/**
 * Client form for /reset-password (added 2026-11-19).
 * Receives the one-time token as a prop from the server page; it is never
 * persisted in localStorage or logged.
 */
export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ตั้งรหัสผ่านไม่สำเร็จ กรุณาลองใหม่");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด: " + (err instanceof Error ? err.message : "กรุณาลองใหม่"));
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
            <CheckCircle size={40} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">ตั้งรหัสผ่านสำเร็จ</h2>
        <p className="text-sm text-gray-600 mb-6">เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลยครับ</p>
        <Link href="/login" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2 text-xs">
          <ArrowLeft size={14} /> ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">ตั้งรหัสผ่านใหม่</h1>
      <p className="text-sm text-gray-500 text-center mb-8">กรอกรหัสผ่านใหม่ที่มีความยาวอย่างน้อย 8 ตัวอักษร</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-xs font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">รหัสผ่านใหม่</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium disabled:opacity-50"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">ยืนยันรหัสผ่าน</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium disabled:opacity-50"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || !token}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black rounded shadow-lg shadow-blue-200 transition-all uppercase tracking-widest text-sm disabled:cursor-not-allowed"
        >
          {isLoading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <Link href="/login" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2 text-xs">
          <ArrowLeft size={14} /> กลับสู่หน้าเข้าสู่ระบบ
        </Link>
      </div>
    </>
  );
}
