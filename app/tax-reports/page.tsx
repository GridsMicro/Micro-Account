import { query } from "@/lib/db";
import { 
  Building2, 
  User, 
  Receipt, 
  Globe, 
  CalendarDays, 
  Download, 
  Upload, 
  ShieldCheck, 
  Star,
  ArrowRight,
  Landmark,
  TrendingUp,
  TrendingDown,
  Calculator
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTaxSummary } from "@/app/actions";

export const dynamic = 'force-dynamic';

const forms = [
  {
    id: "pnd3",
    name: "ภ.ง.ด. 3",
    description: "ภาษีหัก ณ ที่จ่าย (บุคคลธรรมดา)",
    icon: User,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    favorite: true
  },
  {
    id: "pnd53",
    name: "ภ.ง.ด. 53",
    description: "ภาษีหัก ณ ที่จ่าย (นิติบุคคล / License 5%)",
    icon: Building2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    favorite: true
  },
  {
    id: "pp30",
    name: "ภ.พ. 30",
    description: "ภาษีมูลค่าเพิ่ม 7% (ในประเทศ)",
    icon: Receipt,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    favorite: true
  },
  {
    id: "pp36",
    name: "ภ.พ. 36",
    description: "ภาษีมูลค่าเพิ่ม (บริการต่างประเทศ)",
    icon: Globe,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    favorite: true
  },
  {
    id: "pnd51",
    name: "ภ.ง.ด. 51",
    description: "ภาษีเงินได้นิติบุคคลครึ่งปี",
    icon: CalendarDays,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    favorite: false
  }
];

export default async function TaxReportsPage() {
  const summaryRes = await getTaxSummary();
  const taxData = summaryRes.success ? summaryRes.data : { vatSales: 0, vatPurchase: 0, wht: 0, netVat: 0 };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-600 p-3 rounded-lg text-white shadow-md">
               <Landmark size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase flex items-center gap-2">
                E-Filing Dashboard
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                ระบบจัดการภาษีแบบเบ็ดเสร็จ รองรับการทำงานร่วมกับกรมสรรพากร
              </p>
            </div>
          </div>
          <div className="flex flex-col text-right">
             <span className="font-bold text-gray-700 text-sm">บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด</span>
             <span className="text-xs text-gray-500 font-mono tracking-widest">TAX ID: 0123456789012</span>
          </div>
        </div>

        {/* Real-time Tax Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-purple-600">
                 <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp size={18} /></div>
                 <span className="text-xs font-bold uppercase tracking-wider">ภาษีขายเดือนนี้</span>
              </div>
              <p className="text-2xl font-black text-gray-800">฿{taxData?.vatSales.toLocaleString()}</p>
           </div>
           <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-blue-600">
                 <div className="p-2 bg-blue-50 rounded-lg"><TrendingDown size={18} /></div>
                 <span className="text-xs font-bold uppercase tracking-wider">ภาษีซื้อเดือนนี้</span>
              </div>
              <p className="text-2xl font-black text-gray-800">฿{taxData?.vatPurchase.toLocaleString()}</p>
           </div>
           <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2 text-green-600">
                 <div className="p-2 bg-green-50 rounded-lg"><Calculator size={18} /></div>
                 <span className="text-xs font-bold uppercase tracking-wider">ภาษีหัก ณ ที่จ่าย (WHT)</span>
              </div>
              <p className="text-2xl font-black text-gray-800">฿{taxData?.wht.toLocaleString()}</p>
           </div>
           <div className={cn("p-5 rounded-2xl border shadow-md", taxData?.netVat >= 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100")}>
              <div className="flex items-center gap-3 mb-2 text-gray-700">
                 <span className="text-xs font-bold uppercase tracking-wider">ยอดภาษีที่ต้องชำระ (Net)</span>
              </div>
              <p className={cn("text-2xl font-black", taxData?.netVat >= 0 ? "text-red-600" : "text-emerald-600")}>
                 ฿{Math.abs(taxData?.netVat).toLocaleString()}
              </p>
              <p className="text-[10px] font-bold opacity-60 mt-1 uppercase italic">
                 {taxData?.netVat >= 0 ? "*ต้องนำส่งสรรพากรเพิ่มเติม" : "*ได้รับเงินคืนภาษีจากสรรพากร"}
              </p>
           </div>
        </div>

        {/* Highlight Banner for Software/License Tax */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl shadow-lg p-6 mb-10 text-white flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-blue-800/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-blue-600/50">
                <Star size={12} className="text-yellow-400" fill="currentColor" /> โหมดภาษีนวัตกรรมและซอฟต์แวร์
              </div>
              <h2 className="text-xl font-bold mb-2">ระบบจัดการภาษี License 5% อัตโนมัติ</h2>
              <p className="text-sm text-blue-100/80 leading-relaxed">
                เราออกแบบซอฟต์แวร์นี้ให้เข้าใจบริบทของการขาย License และ Software โดยเฉพาะ 
                ระบบจะคำนวณและแยก ภ.ง.ด. 53 (อัตรา 5%) ให้คุณแบบเรียลไทม์ พร้อม Export เป็นไฟล์ Text ส่งสรรพากรได้ทันทีในคลิกเดียว!
              </p>
           </div>
           <button className="whitespace-nowrap h-12 px-6 bg-white text-blue-800 font-black rounded-lg shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform flex items-center gap-2">
             ตั้งค่า License Tax <ArrowRight size={18} />
           </button>
        </div>

        {/* Favorite Forms Panel */}
        <div className="mb-6 flex items-center gap-2 text-yellow-500 font-bold text-lg">
           <Star size={20} fill="currentColor" /> รายการโปรด (Favorite Forms)
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
           {forms.map((form) => (
             <div key={form.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="p-6">
                   <div className="flex items-start justify-between mb-4">
                      <div className={cn("p-3 rounded-lg border", form.bg, form.color, form.border)}>
                         <form.icon size={24} />
                      </div>
                      {form.favorite && <Star className="text-yellow-400" fill="currentColor" size={18} />}
                   </div>
                   <h3 className="text-2xl font-black text-gray-800 tracking-tighter mb-1">{form.name}</h3>
                   <p className="text-sm text-gray-500 font-medium h-10">{form.description}</p>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                   <button className="w-full h-10 bg-white border border-green-500 text-green-600 font-bold rounded flex items-center justify-center gap-2 hover:bg-green-50 transition-colors shadow-sm text-sm">
                      <ShieldCheck size={16} /> ยื่นแบบออนไลน์ (E-Filing)
                   </button>
                   <button className="w-full h-10 bg-white border border-gray-300 text-gray-700 font-bold rounded flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors text-sm">
                      <Download size={16} /> โหลดไฟล์ยื่นแบบ (.txt)
                   </button>
                </div>
             </div>
           ))}
        </div>

        {/* Smart Processing / RD Check */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center justify-between mb-12">
           <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="bg-gray-100 p-4 rounded-full text-gray-500 border border-gray-200">
                 <Upload size={32} />
              </div>
              <div>
                 <h4 className="font-bold text-gray-800 text-lg uppercase tracking-tight">ตรวจสอบไฟล์ก่อนนำส่ง</h4>
                 <p className="text-sm text-gray-500">
                   นำไฟล์ที่ Export มาตรวจสอบ Format ความถูกต้องเชิงลึก ก่อนอัปโหลดเข้าสู่เว็บไซต์กรมสรรพากร (RD Server)
                 </p>
              </div>
           </div>
           <button className="h-12 px-8 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg shadow-md transition-all uppercase tracking-widest text-sm w-full md:w-auto">
              Scan File
           </button>
        </div>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-8 mt-12">
           <p className="font-bold mb-1">© 2026 สงวนลิขสิทธิ์โดย บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด</p>
           <p className="italic opacity-80">เราสร้าง Software เฉพาะทาง เพื่อขับเคลื่อนธุรกิจให้ก้าวล้ำ นำภาษีสู่ระบบอัตโนมัติ</p>
        </div>
      </div>
    </main>
  );
}
