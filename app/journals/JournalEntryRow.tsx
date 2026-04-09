"use client";

import { useState } from "react";
import { Pencil, Trash2, X, ExternalLink, FileText, Tag, Banknote, CheckCircle2 } from "lucide-react";
import { deleteJournalEntry, updateJournalEntry } from "@/app/actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface JournalEntry {
  id: number | string;
  entry_date: string;
  reference_no: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
  receipt_url?: string | null;
  readonly?: boolean;
}

export default function JournalEntryRow({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const isReadonly = Boolean(entry.readonly);
  const isRecurringAutoEntry = (entry.description || "").includes("Auto: Recurring WHT 3%");

  const [accountName, setAccountName] = useState(entry.account_name);
  const [description, setDescription] = useState(entry.description);
  const [referenceNo, setReferenceNo] = useState(entry.reference_no || "");
  const [amount, setAmount] = useState(
    String(Number(entry.debit) > 0 ? entry.debit : entry.credit)
  );
  const [entryDate, setEntryDate] = useState(
    entry.entry_date ? new Date(entry.entry_date).toISOString().split("T")[0] : ""
  );

  const handleDelete = async () => {
    if (isReadonly) return;
    if (!confirm(`Delete journal entry "${entry.account_name}"? This action is permanent.`)) return;

    setLoading(true);
    try {
      const res = await deleteJournalEntry(entry.id);
      if (res.success) {
        router.refresh();
      } else {
        alert("Delete failed: " + res.error);
        setLoading(false);
      }
    } catch (err: any) {
      alert("Unexpected error: " + err.message);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isReadonly) return;
    setLoading(true);
    const isDebit = Number(entry.debit) > 0;
    const res = await updateJournalEntry(entry.id, {
      entry_date: entryDate,
      reference_no: referenceNo,
      account_name: accountName,
      description,
      debit: isDebit ? Number(amount) : 0,
      credit: !isDebit ? Number(amount) : 0,
      receipt_url: entry.receipt_url,
    });
    setLoading(false);
    if (res.success) {
      setIsEditing(false);
    } else {
      alert("Save failed: " + res.error);
    }
  };

  if (isEditing && !isReadonly) {
    return (
      <tr className="animate-in fade-in slide-in-from-top-1 duration-300 border-l-4 border-blue-600 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
        <td colSpan={4} className="p-8">
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl">
            <div className="flex items-center justify-between bg-blue-600 px-6 py-3">
              <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
                <Pencil size={14} /> Edit Journal Entry
              </h4>
              <span className="text-[10px] font-medium text-blue-100">ID: #{entry.id}</span>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4 border-r border-gray-100 pr-0 md:pr-6">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <Tag size={12} className="text-blue-500" /> Account
                    </label>
                    <input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 font-black text-gray-800 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <FileText size={12} className="text-blue-500" /> Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={1}
                      className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm italic text-gray-600 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5 rounded-2xl border border-blue-100/50 bg-blue-50/50 p-4">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500">
                      <Banknote size={12} /> Amount ({Number(entry.debit) > 0 ? "Dr." : "Cr."})
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 w-full bg-transparent text-right text-2xl font-black text-blue-700 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-100 font-bold text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={loading}
                      className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 font-black text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 active:scale-95"
                    >
                      {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle2 size={16} />}
                      {loading ? "Saving..." : "Update Entry"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={cn(
        "group relative border-b border-gray-50 transition-all hover:bg-gray-50/50",
        Number(entry.credit) > 0 ? "bg-green-50/5" : ""
      )}
    >
      <td className="px-6 py-4">
        <div
          className={cn(
            "flex flex-col border-l-2 pl-4 transition-all",
            Number(entry.credit) > 0 ? "ml-12 border-green-400 py-1" : "border-blue-500 py-1"
          )}
        >
          <span
            className={cn(
              "text-sm font-bold tracking-tight",
              Number(entry.credit) > 0 ? "text-green-700" : "text-gray-800"
            )}
          >
            {entry.account_name}
          </span>
          {isRecurringAutoEntry ? (
            <span className="mt-1 inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
              Auto: Recurring WHT 3%
            </span>
          ) : null}
          <span className="mt-0.5 text-[10px] font-medium italic text-gray-400">{entry.description}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        {Number(entry.debit) > 0 ? (
          <span className="text-sm font-black text-blue-600">
            ฿{Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-[10px] text-gray-100">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        {Number(entry.credit) > 0 ? (
          <span className="text-sm font-black text-green-600">
            ฿{Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-[10px] text-gray-100">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-0 transition-all group-hover:opacity-100">
          {entry.receipt_url ? (
            <a
              href={entry.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-50 text-blue-400 transition-all hover:bg-blue-500 hover:text-white"
              title="Open attachment"
            >
              <ExternalLink size={14} />
            </a>
          ) : null}
          {!isReadonly ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 text-gray-400 shadow-sm transition-all hover:bg-blue-600 hover:text-white"
                title="Edit entry"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-50 text-gray-300 shadow-sm transition-all hover:bg-red-500 hover:text-white disabled:opacity-40"
                title="Delete entry"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
