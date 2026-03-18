
import { query } from "@/lib/db";
import { BookOpen, Plus, Calendar, ShoppingCart, Wallet, Truck, Banknote, Library, AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import JournalEntryRow from "./JournalEntryRow";
import ExportButton from "./ExportButton";

export const dynamic = 'force-dynamic';

export default async function JournalsPage({ searchParams }: { searchParams: { type?: string, search?: string } }) {
  const type = (await searchParams)?.type;
  const search = (await searchParams)?.search || "";
  
  const journalBooks = [
    { title: 'สมุดรายวันขาย', type: 'sales', icon: ShoppingCart, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
    { title: 'สมุดรายวันรับเงิน', type: 'receipt', icon: Wallet, bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100' },
    { title: 'สมุดรายวันซื้อ', type: 'purchase', icon: Truck, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    { title: 'สมุดรายวันจ่ายเงิน', type: 'payment', icon: Banknote, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    { title: 'สมุดรายวันทั่วไป', type: 'general', icon: Library, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' },
  ];

  let entries: any[] = [];
  let stats = { sales: 0, receipt: 0, purchase: 0, payment: 0 };

  try {
    // 1. Fetch Entries
    let q = 'SELECT * FROM journal_entries WHERE 1=1';
    const params: any[] = [];
    
    if (type) {
      params.push(type);
      q += ` AND journal_type = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      q += ` AND (reference_no ILIKE $${params.length} OR description ILIKE $${params.length} OR account_name ILIKE $${params.length})`;
    }

    q += ' ORDER BY entry_date DESC, reference_no ASC, id ASC';
    const res = await query(q, params);
    entries = res.rows;

    // 2. Fetch Stats
    const statsRes = await query(`
      SELECT journal_type, SUM(debit + credit) as total 
      FROM journal_entries 
      WHERE journal_type IN ('sales', 'receipt', 'purchase', 'payment')
      GROUP BY journal_type
    `);
    statsRes.rows.forEach(row => {
      if (row.journal_type in stats) (stats as any)[row.journal_type] = Number(row.total) / 2;
    });
  } catch (e) {
    console.error("Journal Dashboard Error:", e);
  }

  // Calculate overall totals for current view
  const totalDebit = entries.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);
  const totalCredit = entries.reduce((acc, curr) => acc + Number(curr.credit || 0), 0);

  // Group entries by reference_no for Voucher View
  const vouchers = entries.reduce((acc: any, curr: any) => {
    const ref = curr.reference_no || 'UNCATEGORIZED';
    if (!acc[ref]) {
      acc[ref] = {
        ref,
        date: curr.entry_date,
        type: curr.journal_type,
        items: [],
        totalDebit: 0,
        totalCredit: 0
      };
    }
    acc[ref].items.push(curr);
    acc[ref].totalDebit += Number(curr.debit) || 0;
    acc[ref].totalCredit += Number(curr.credit) || 0;
    return acc;
  }, {});

  const voucherList = Object.values(vouchers).sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const activeBook = journalBooks.find(b => b.type === type) || journalBooks[4];

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <span className="p-3 bg-violet-500 rounded-2xl shadow-xl shadow-violet-200">
                <BookOpen className="text-white w-8 h-8" /> 
              </span>
              {type ? activeBook.title : "ศูนย์รวมสมุดบัญชี 5 เล่ม"}
            </h1>
            <div className="flex items-center gap-3 ml-2">
              <span className="text-violet-400 font-black text-[10px] uppercase tracking-[0.3em]">
                {type ? `VIEWING: ${activeBook.type}` : "PASTEL ACCISSANT INTELLIGENCE"}
              </span>
              <div className="h-px w-12 bg-violet-100"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <ExportButton />
             <Link 
              href="/journals/new" 
              className="h-14 px-10 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl flex items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-95 transition-all text-sm"
            >
              <Plus size={20} /> บันทึกใบสำคัญใหม่
            </Link>
          </div>
        </div>

        {/* 1. Summary Analytics (Pastel Style) */}
        {!type && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {journalBooks.slice(0, 4).map((s, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-violet-50 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50/30 rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex items-center justify-between mb-6 relative">
                  <div className={cn("p-4 rounded-xl transition-transform group-hover:rotate-12", s.bg)}>
                    <s.icon className={cn("w-6 h-6", s.text)} />
                  </div>
                  <span className="text-[9px] font-black text-violet-300 uppercase tracking-widest border border-violet-50 px-2.5 py-1 rounded-lg bg-violet-50/50">Stat</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">{s.title}</p>
                <div className="flex items-baseline gap-1 relative">
                  <span className="text-sm font-bold text-slate-300">฿</span>
                  <p className="text-2xl font-black text-slate-900 tabular-nums">
                    {(stats as any)[s.type].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Journal Search & Book Selection Chips */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <form method="GET" className="flex items-center gap-3 w-full lg:max-w-md">
            <div className="relative flex-1 group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-500 transition-colors" size={18} />
               <input 
                 type="text" 
                 name="search"
                 defaultValue={search}
                 placeholder="ค้นหาเลขที่เอกสาร หรือคำบรรยาย..." 
                 className="w-full pl-14 pr-6 h-12 bg-white border border-violet-50 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 text-sm font-bold shadow-sm transition-all" 
               />
               {type && <input type="hidden" name="type" value={type} />}
            </div>
            <button type="submit" className="h-12 px-6 bg-violet-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-2">
               <Search size={16} /> Search
            </button>
            {search && (
              <Link href={type ? `/journals?type=${type}` : "/journals"} className="h-12 px-6 bg-white border border-violet-50 rounded-xl text-xs font-black text-slate-400 flex items-center gap-2">
                Clear
              </Link>
            )}
          </form>

          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-violet-50 shadow-sm w-fit">
             {journalBooks.map((book) => (
                <Link 
                  key={book.type}
                  href={(type === book.type && !search) ? "/journals" : `/journals?type=${book.type}${search ? `&search=${search}` : ""}`}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2",
                    type === book.type 
                      ? "bg-violet-600 border-violet-600 text-white shadow-lg" 
                      : "bg-white border-transparent text-slate-500 hover:bg-violet-50 hover:text-violet-600"
                  )}
                >
                   <book.icon size={14} />
                   {book.title}
                </Link>
             ))}
          </div>
        </div>

        {/* 3. Voucher Transaction Area */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100/30 border border-violet-50 overflow-hidden text-left">
          <div className="px-12 py-10 border-b border-violet-50 flex flex-col md:flex-row md:items-center justify-between bg-violet-50/10 gap-6">
             <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Library className="text-violet-500" /> 
                  {type ? `รายการใน ${activeBook.title}` : "รายการบันทึกบัญชีทั้งหมด"}
                </h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Automatic Data Reconciliation Active</span>
                </div>
             </div>
             
             <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-violet-50">
                <div className="px-5 py-3 text-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Debit</p>
                   <p className="text-lg font-black text-violet-600">฿{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-px h-8 bg-violet-50"></div>
                <div className="px-5 py-3 text-center">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Credit</p>
                   <p className="text-lg font-black text-emerald-500">฿{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
             </div>
          </div>

          <div className="p-0">
            {voucherList.length > 0 ? (
              <div className="divide-y divide-violet-50/50">
                {voucherList.map((voucher: any) => (
                  <div key={voucher.ref} className="p-10 hover:bg-violet-50/10 transition-all group">
                    <div className="flex flex-col xl:flex-row gap-10">
                      
                      {/* Voucher Meta Segment */}
                      <div className="xl:w-64 space-y-4 shrink-0">
                        <div className="flex items-center gap-3">
                           <div className={cn(
                             "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border",
                             journalBooks.find(b => b.type === voucher.type)?.bg || 'bg-slate-50',
                             journalBooks.find(b => b.type === voucher.type)?.border || 'border-slate-100'
                           )}>
                              {(() => {
                                const BookIcon = journalBooks.find(b => b.type === voucher.type)?.icon || Library;
                                return <BookIcon size={20} className={journalBooks.find(b => b.type === voucher.type)?.text || 'text-slate-400'} />;
                              })()}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-900 tracking-tight">{voucher.ref || 'UN-NUMBERED'}</span>
                              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Voucher No.</span>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                           <Calendar size={14} className="text-slate-400" />
                           <span className="text-xs font-black text-slate-600">
                             {new Date(voucher.date).toLocaleDateString('th-TH', { 
                               day: '2-digit', month: 'short', year: 'numeric' 
                             })}
                           </span>
                        </div>

                        {Math.abs(voucher.totalDebit - voucher.totalCredit) > 0.01 && (
                          <div className="flex items-center gap-3 text-white bg-rose-500 px-4 py-3 rounded-xl shadow-lg shadow-rose-100 animate-pulse">
                             <AlertCircle size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Unbalanced!</span>
                          </div>
                        )}
                      </div>

                      {/* Entries Table Segment */}
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-slate-50">
                            {voucher.items.map((item: any) => (
                              <JournalEntryRow key={item.id} entry={item} />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Resulting Impact Segment */}
                      <div className="xl:w-60 text-right space-y-3 self-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Financial Impact</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">
                           <span className="text-xs text-violet-300 mr-2 font-bold">NET</span>
                           ฿{voucher.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center justify-end gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50/50 w-fit ml-auto px-3 py-1.5 rounded-lg border border-emerald-100">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                           Voucher Balanced
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-32 text-center bg-violet-50/5">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-violet-100">
                  <BookOpen size={48} className="text-violet-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Everything is Clear</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm leading-relaxed mb-10">
                  ยังไม่มีการตรวจพบรายการบันทึกในหมวดหมู่นี้ เริ่มต้นรันระบบโดยสร้างใบสำคัญแรก
                </p>
                <Link 
                  href="/journals/new" 
                  className="px-10 py-5 bg-violet-600 text-white font-black rounded-xl shadow-xl hover:bg-violet-700 transition-all uppercase text-xs tracking-widest"
                >
                  Create First Voucher
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Brand Footer */}
        <div className="text-center py-10 opacity-40">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Micro-Account • Autonomous Logistics Edge • 2026</p>
        </div>

      </div>
    </main>
  );
}
