import { query } from "@/lib/db";
import { 
  Building2, 
  Users, 
  ReceiptThai, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard,
  Plus
} from "lucide-react";

async function getDashboardData() {
  const companyRes = await query('SELECT * FROM company LIMIT 1');
  const userCount = await query('SELECT COUNT(*) FROM users');
  const invoiceCount = await query('SELECT COUNT(*) FROM invoices');
  const productCount = await query('SELECT COUNT(*) FROM products');
  
  return {
    company: companyRes.rows[0],
    stats: {
      users: userCount.rows[0].count,
      invoices: invoiceCount.rows[0].count,
      products: productCount.rows[0].count
    }
  };
}

export default async function Home() {
  const data = await getDashboardData();
  const { company, stats } = data;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Micro-Account</h1>
              <p className="text-[10px] text-blue-600 uppercase font-bold tracking-widest leading-none">Powered by Antigravity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-10 w-px bg-slate-200 mx-2" />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">Administrator</p>
              <p className="text-xs text-slate-500">Global Control Mode</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner">
              <Users size={20} className="text-slate-400" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl transition-all duration-700 group-hover:scale-125" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-blue-200 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Online Sync Active
              </div>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">
                {company?.name || "ยินดีต้อนรับสู่ระบบบัญชี"}
              </h2>
              <p className="text-blue-100/70 text-lg">
                ระบบจัดการภาษีและบัญชีอัตโนมัติ สำหรับพนักงานและผู้บริหารยุคดิจิทัล <br className="hidden md:block" />
                เลขประจำตัวผู้เสียภาษี: <span className="text-blue-200 font-mono font-bold tracking-wider">{company?.tax_id || '-'}</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center gap-2 group">
                <Plus size={20} />
                สร้างเอกสารใหม่
              </button>
              <button className="h-14 px-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md transition-all active:scale-95">
                ดูรายงานงบ
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 font-sans">
          
          {/* Card 1 */}
          <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <TrendingUp size={28} />
              </div>
              <span className="flex items-center text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
                <ArrowUpRight size={14} className="mr-1" />
                +12%
              </span>
            </div>
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">ยอดขายค้างรับ</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">฿0.00</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                <CreditCard size={28} />
              </div>
              <span className="flex items-center text-red-600 text-sm font-bold bg-red-50 px-3 py-1 rounded-full">
                <ArrowDownRight size={14} className="mr-1" />
                -2%
              </span>
            </div>
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">ค่าใช้จ่ายเดือนนี้</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">฿0.00</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <ReceiptThai size={28} />
              </div>
            </div>
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">ใบแจ้งหนี้รวม</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">{stats.invoices}</span>
              <span className="text-sm font-bold text-slate-400 ml-1">ฉบับ</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Users size={28} />
              </div>
            </div>
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">พนักงานในระบบ</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">{stats.users}</span>
              <span className="text-sm font-bold text-slate-400 ml-1">ท่าน</span>
            </div>
          </div>

        </div>

        {/* Recent Actions Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black">รายการล่าสุด (Recent Activity)</h3>
              <button className="text-blue-600 text-sm font-bold hover:underline">ดูทั้งหมด</button>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm">
                      <Plus size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">ระบบเริ่มต้นทำงานออนไลน์</p>
                      <p className="text-xs text-slate-400">ทำการเชื่อมต่อฐานข้อมูล Neon สำเร็จ</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">14:23</p>
                    <p className="text-xs text-green-500 font-bold uppercase tracking-tight">Sync Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-6">สถานะระบบออนไลน์</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-green-50 p-6 rounded-[2rem] border border-green-100 shadow-sm shadow-green-200/20">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest leading-none mb-2">Cloud Provider</p>
                    <p className="text-xl font-black text-green-900">NEON DATABASE</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                    <TrendingUp size={24} />
                  </div>
                </div>
                
                <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest leading-none mb-4">Vision 2026</p>
                  <p className="text-lg font-bold leading-relaxed mb-4">
                    "มุ่งสู่การบริหารจัดการที่ไร้ขีดจำกัด พนักงานทุกคนเชื่อมถึงกัน 100%"
                  </p>
                  <div className="h-1 w-12 bg-blue-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
