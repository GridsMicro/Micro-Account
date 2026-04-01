"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RecurringRunButton() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [runDate, setRunDate] = useState(new Date().toISOString().split("T")[0]);
  const router = useRouter();
  const { data: session } = useSession();
  const normalizedRole = String((session?.user as any)?.role || "").trim().toLowerCase();
  const canRunBilling = ["admin", "manager", "super admin", "super_admin"].includes(normalizedRole);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recurring/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-recurring-secret': secret },
        body: JSON.stringify({ date: runDate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      alert(`Created: ${data.created?.length || 0}, Skipped: ${data.skipped?.length || 0}`);
      router.refresh();
      setOpen(false);
    } catch (err: any) {
      alert('Run failed: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (!canRunBilling) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="h-12 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 transition-all text-sm font-black">
        <Play size={16} /> Run Billing
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Run Recurring Billing</h3>
            <label className="text-sm font-medium">Recurring Secret</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full mt-2 mb-4 p-3 border rounded-lg"
              placeholder="Enter x-recurring-secret"
            />
            <label className="text-sm font-medium">Run Date</label>
            <input
              type="date"
              value={runDate}
              onChange={(e) => setRunDate(e.target.value)}
              className="w-full mt-2 mb-4 p-3 border rounded-lg"
            />
            <p className="text-xs text-slate-500 mb-4">Managers can run the live billing batch for the selected date when `RECURRING_SECRET` is provided.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={handleRun} disabled={loading || !secret} className="px-4 py-2 bg-emerald-600 text-white rounded">{loading ? 'Running...' : 'Run'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
