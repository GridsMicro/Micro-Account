"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Book, Search, ShieldCheck, Tag, Info, AlertCircle, Plus, Edit2, Trash2, X, CheckCircle } from "lucide-react";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "@/app/actions";
import { cn } from "@/lib/utils";

export default function COAPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    account_code: "",
    account_name_th: "",
    account_name_en: "",
    account_type: "asset",
    account_category: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    const res = await getAccounts(search);
    if (res.success) {
      setAccounts(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, [search]);

  const handleOpenAdd = (prefix: string = "") => {
    setEditingId(null);
    setFormData({
      account_code: prefix,
      account_name_th: "",
      account_name_en: "",
      account_type: prefix === "1" ? "asset" : prefix === "2" ? "liability" : prefix === "3" ? "equity" : prefix === "4" ? "revenue" : "expense",
      account_category: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingId(acc.id);
    setFormData({
      account_code: String(acc.code),
      account_name_th: acc.name,
      account_name_en: acc.account_name_en || "",
      account_type: acc.account_type || "asset",
      account_category: acc.account_category || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบรหัสบัญชีนี้? (ไม่สามารถลบได้หากมีการบันทึกบัญชีแล้ว)")) return;
    const res = await deleteAccount(id);
    if (res.success) {
      alert("ลบข้อมูลสำเร็จ");
      fetchAccounts();
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Auto-detect type based on code prefix
    const prefix = formData.account_code.charAt(0);
    const typeMap: any = { "1": "asset", "2": "liability", "3": "equity", "4": "revenue", "5": "expense" };
    const finalData = { ...formData, account_type: typeMap[prefix] || "expense" };

    const res = editingId 
      ? await updateAccount(editingId, finalData)
      : await createAccount(finalData);

    if (res.success) {
      setIsModalOpen(false);
      fetchAccounts();
    } else {
      alert("Error: " + res.error);
    }
    setIsSubmitting(false);
  };

  const categories = [
    { id: "asset", name: "สินทรัพย์ (Assets)", prefix: "1", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { id: "liability", name: "หนี้สิน (Liabilities)", prefix: "2", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
    { id: "equity", name: "ส่วนของเจ้าของ (Equity)", prefix: "3", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
    { id: "revenue", name: "รายได้ (Revenue)", prefix: "4", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { id: "expense", name: "ค่าใช้จ่าย (Expenses)", prefix: "5", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 relative overflow-x-hidden">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/journals" className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50">
              <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-indigo-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Chart of Accounts</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-500 underline underline-offset-4 decoration-indigo-200">ระบบจัดการผังบัญชีมังกร</span>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Autonomous CRUD</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหารหัสหรือชื่อ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none ring-indigo-500/10 transition-all focus:border-indigo-500 focus:ring-4"
              />
            </div>
            <button 
              onClick={() => handleOpenAdd()}
              className="flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" /> Add Account
            </button>
          </div>
        </div>

        {/* COA List */}
        <div className="grid grid-cols-1 gap-12">
          {categories.map((cat) => (
            <div key={cat.id} className="group/cat space-y-6">
              <div className="flex items-center justify-between">
                <h3 className={cn("flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em]", cat.color)}>
                   <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border", cat.bg, cat.border)}>
                      <Tag size={16} />
                   </div>
                   {cat.name}
                   <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover/cat:opacity-100 transition-opacity">({cat.prefix}xxxx)</span>
                </h3>
                <button 
                  onClick={() => handleOpenAdd(cat.prefix)}
                  className={cn("text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border", cat.bg, cat.color, cat.border, "hover:scale-105 active:scale-95")}
                >
                  Quick Add
                </button>
              </div>
              
              <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-2xl hover:shadow-indigo-900/5 group">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="px-10 py-6 text-center w-32">Code</th>
                        <th className="px-6 py-6">Account Name</th>
                        <th className="px-6 py-6 text-center">Status</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                         <tr>
                           <td colSpan={4} className="px-10 py-20 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse text-center">Summoning Ledger data...</span>
                              </div>
                           </td>
                         </tr>
                      ) : (
                        accounts
                          .filter(acc => String(acc.code).startsWith(cat.prefix))
                          .map((acc) => (
                            <tr key={acc.id} className="group transition-colors hover:bg-slate-50/50">
                              <td className="px-10 py-6 text-center">
                                <span className={cn("inline-block rounded-xl px-4 py-2 text-xs font-black tracking-widest border shadow-sm group-hover:shadow-md transition-all", cat.bg, cat.color, cat.border)}>
                                  {acc.code}
                                </span>
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{acc.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{acc.account_name_en || "System Managed Account"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live</span>
                                </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                  <button 
                                    onClick={() => handleOpenEdit(acc)}
                                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-indigo-100"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(acc.id)}
                                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-rose-100"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                      {!loading && accounts.filter(acc => String(acc.code).startsWith(cat.prefix)).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-10 py-16 text-center">
                             <div className="flex flex-col items-center gap-2 opacity-30">
                                <Info size={32} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empty Domain of {cat.id}</span>
                             </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Overlay */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-10">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-slate-200">
              <div className="bg-indigo-600 px-10 py-8 text-white relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform">
                   <ShieldCheck size={120} />
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{editingId ? "Update Account" : "Enlist Account"}</h2>
                <p className="mt-2 text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em] opacity-80 leading-none">Dragon Ledger Authorization Required</p>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <Tag size={12} className="text-indigo-500" /> Account Code
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., 1111"
                      value={formData.account_code}
                      onChange={(e) => setFormData({...formData, account_code: e.target.value})}
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Type</label>
                    <div className="flex h-14 items-center gap-1 rounded-2xl border border-slate-100 bg-slate-100/50 px-1">
                      {['asset', 'liability', 'equity', 'revenue', 'expense'].map(t => (
                        <div key={t} className={cn("flex-1 h-10 rounded-xl flex items-center justify-center text-[7px] font-black uppercase tracking-tighter transition-all border", formData.account_type === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 border-indigo-700 scale-105' : 'text-slate-400 border-transparent')}>
                           {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 inline-block">Account Name (TH)</label>
                  <input
                    required
                    type="text"
                    placeholder="ชื่อชื่อบัญชีภาษาไทย..."
                    value={formData.account_name_th}
                    onChange={(e) => setFormData({...formData, account_name_th: e.target.value})}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 inline-block">Account Name (EN)</label>
                  <input
                    type="text"
                    placeholder="Account Name in English..."
                    value={formData.account_name_en}
                    onChange={(e) => setFormData({...formData, account_name_en: e.target.value})}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  />
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-14 flex-1 rounded-2xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-14 flex-[2] rounded-2xl bg-indigo-600 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <CheckCircle size={16} />}
                    {editingId ? "Confirm Update" : "Establish Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Stats Footer */}
        <div className="rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
           <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="flex items-center gap-6">
                 <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform border border-white/5 shadow-2xl">
                    <Book size={32} />
                 </div>
                 <div className="flex flex-col">
                    <h4 className="text-xl font-black italic tracking-tighter">Dragon Chart Ledger <span className="text-indigo-500 text-sm align-top ml-1">v2.0</span></h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1 opacity-60">Verified Automated Directory Control</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                 {categories.map(c => (
                    <div key={c.id} className="flex flex-col items-center bg-white/5 rounded-2xl p-4 border border-white/5 shadow-inner">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", c.color)}>{c.id}</span>
                        <span className="text-xl font-black mt-1 leading-none">{accounts.filter(a => String(a.code).startsWith(c.prefix)).length}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
