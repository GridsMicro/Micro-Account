import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

/**
 * Reset-password landing page (added 2026-11-19).
 * Server component reads the one-time token from the query string and passes it
 * to the client form. In Next.js 16 `searchParams` is async.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = typeof raw === "string" ? raw : "";

  return (
    <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded shadow-md border-t-4 border-blue-600 p-8">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="text-center">
            <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">ลิงก์ไม่สมบูรณ์</h1>
            <p className="text-sm text-gray-600 mb-6">
              ไม่พบรหัสยืนยันในลิงก์ กรุณาใช้ลิงก์จากอีเมลฉบับล่าสุด หรือขอลิงก์ใหม่อีกครั้ง
            </p>
            <Link href="/forgot-password" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2 text-xs">
              <ArrowLeft size={14} /> ขอลิงก์ใหม่ตั้งรหัสผ่าน
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
