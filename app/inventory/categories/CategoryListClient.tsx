'use client';

import { useState, useTransition } from 'react';
import { createCategory, updateCategory, deleteCategory } from "@/app/actions";
import { Plus, Trash2, Edit, Save, X, Layers, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

export default function CategoryListClient({ initialCategories }: { initialCategories: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState(initialCategories);
  const [isCreating, setIsCreating] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ name: '', description: '' });

  const handleCreate = async () => {
    if (!newCat.name) return;
    
    startTransition(async () => {
      const res = await createCategory(newCat.name, newCat.description);
      if (res.success) {
        setCategories([...categories, { id: res.id, ...newCat }]);
        setNewCat({ name: '', description: '' });
        setIsCreating(false);
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleUpdate = async (id: number) => {
    if (!editData.name) return;
    
    startTransition(async () => {
      const res = await updateCategory(id, editData.name, editData.description);
      if (res.success) {
        setCategories(categories.map(c => c.id === id ? { ...c, ...editData } : c));
        setEditingId(null);
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบประเภทสินค้านี้ใช่หรือไม่?')) return;
    
    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        setCategories(categories.filter(c => c.id !== id));
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-6 relative">
      {isPending && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-violet-100 flex items-center gap-4 animate-in zoom-in-95">
             <Loader2 className="animate-spin text-violet-600" size={24} />
             <span className="font-black text-slate-800 uppercase tracking-widest text-xs">Processing...</span>
          </div>
        </div>
      )}
      
      {/* Search and Add Header */}
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-black text-slate-800 tracking-tight">รายการประเภทสินค้า</h2>
         <button 
           onClick={() => setIsCreating(true)}
           disabled={isPending}
           className="px-6 py-3 bg-violet-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
         >
           <Plus size={16} /> Add Category
         </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
         
         {/* Creating State (Inline Card) */}
         {isCreating && (
            <div className="bg-white border-2 border-dashed border-violet-200 p-8 rounded-[2rem] shadow-xl animate-in zoom-in-95 duration-200">
               <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Category Name..." 
                    value={newCat.name}
                    onChange={e => setNewCat({...newCat, name: e.target.value})}
                    className="w-full h-12 px-5 bg-slate-50 border-2 border-transparent focus:border-violet-400 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all text-sm"
                  />
                  <textarea 
                    placeholder="Short description..." 
                    value={newCat.description}
                    onChange={e => setNewCat({...newCat, description: e.target.value})}
                    className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-violet-400 focus:bg-white rounded-2xl outline-none font-medium text-slate-500 transition-all text-xs"
                    rows={2}
                  />
                  <div className="flex gap-2">
                     <button 
                       onClick={handleCreate}
                       disabled={isPending}
                       className="flex-1 h-12 bg-violet-600 text-white font-black rounded-xl hover:bg-violet-700 transition-all text-xs uppercase tracking-widest"
                     >
                       Save
                     </button>
                     <button 
                       onClick={() => setIsCreating(false)}
                       className="w-12 h-12 bg-slate-100 text-slate-400 font-black rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center"
                     >
                       <X size={20} />
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Existing Categories */}
         {categories.map((cat) => (
            <div key={cat.id} className="group bg-white p-8 rounded-[2rem] border border-violet-50/50 shadow-xl shadow-violet-100/10 hover:shadow-violet-200/30 transition-all relative overflow-hidden">
               
               {editingId === cat.id ? (
                  <div className="space-y-4">
                     <input 
                        type="text" 
                        value={editData.name}
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        className="w-full h-10 px-4 bg-slate-50 border border-violet-200 rounded-xl outline-none font-bold text-slate-800 text-sm"
                     />
                     <textarea 
                        value={editData.description}
                        onChange={e => setEditData({...editData, description: e.target.value})}
                        className="w-full p-4 bg-slate-50 border border-violet-200 rounded-xl outline-none font-medium text-slate-500 text-xs"
                        rows={2}
                     />
                     <div className="flex gap-2">
                        <button onClick={() => handleUpdate(cat.id)} disabled={isPending} className="flex-1 h-10 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all text-xs uppercase tracking-widest">Update</button>
                        <button onClick={() => setEditingId(null)} className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center"><X size={16} /></button>
                     </div>
                  </div>
               ) : (
                  <div className="flex flex-col h-full">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100/50 group-hover:scale-110 transition-transform duration-300">
                           <Layers className="text-violet-500 w-6 h-6" />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => { setEditingId(cat.id); setEditData({ name: cat.name, description: cat.description || '' }); }}
                             className="p-2 bg-slate-50 text-slate-400 hover:bg-violet-600 hover:text-white rounded-xl transition-all"
                           >
                             <Edit size={14} />
                           </button>
                           <button 
                             onClick={() => handleDelete(cat.id)}
                             disabled={isPending}
                             className="p-2 bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                     <h4 className="text-xl font-black text-slate-800 mb-2 truncate group-hover:text-violet-600 transition-colors uppercase tracking-tight">{cat.name}</h4>
                     <p className="text-xs font-medium text-slate-400 leading-relaxed line-clamp-2">
                        {cat.description || "No description set for this category."}
                     </p>
                  </div>
               )}
            </div>
         ))}

         {categories.length === 0 && !isCreating && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
               <p className="text-slate-300 font-black text-xs uppercase tracking-widest">No Categories Found</p>
            </div>
         )}
         
      </div>

    </div>
  );
}
