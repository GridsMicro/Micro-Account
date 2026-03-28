
import { getCategories } from "@/app/actions";
import { FolderTree, Plus, ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
import CategoryListClient from "./CategoryListClient";

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const res = await getCategories();
  const categories = res.success ? (res.data ?? []) : [];

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#f8f9ff]">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="space-y-1">
              <Link href="/inventory" className="flex items-center gap-2 text-violet-500 font-bold text-sm hover:gap-3 transition-all mb-2">
                 <ArrowLeft size={16} /> กลับไปคลังสินค้า
              </Link>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                 <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200 text-white">
                    <FolderTree size={32} />
                 </span>
                 จัดการประเภทสินค้า
              </h1>
              <p className="text-slate-400 font-medium text-sm ml-1">Manage your product categorization for better inventory tracking</p>
           </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Summary Stats / Info Card */}
           <div className="space-y-6">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-8 rounded-[2rem] shadow-2xl shadow-violet-200 text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-1000"></div>
                 <Layers className="mb-6 opacity-50" size={40} />
                 <h2 className="text-3xl font-black mb-2">{categories.length}</h2>
                 <p className="text-violet-100 font-bold text-xs uppercase tracking-widest">Total Categories</p>
                 <div className="mt-8 pt-6 border-t border-white/10 text-xs font-medium text-violet-200 leading-relaxed">
                    การแยกประเภทสินค้าช่วยให้คุณค้นหาสินค้าได้ง่ายขึ้น และสรุปรายงานยอดขายตามหมวดหมู่ได้แม่นยำ
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-violet-100 shadow-xl shadow-violet-100/20">
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Pro Tip</h3>
                 <p className="text-slate-500 text-xs leading-relaxed font-medium">
                    คุณควรตั้งชื่อประเภทสินค้าให้สั้นและเข้าใจง่าย เช่น "Hardware", "Software", "Service" เพื่อความสะดวกในการใช้งาน
                 </p>
              </div>
           </div>

           {/* Main List & CRUD */}
           <div className="lg:col-span-2">
              <CategoryListClient initialCategories={categories} />
           </div>

        </div>

      </div>
    </main>
  );
}
