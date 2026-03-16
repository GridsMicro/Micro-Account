import { ShieldCheck, Lock, Users, Eye, Edit, Trash2, CheckCircle2 } from "lucide-react";

export default function PermissionsPage() {
  const roles = [
    { 
      name: "Super Admin", 
      desc: "เข้าถึงได้ทุกส่วนของระบบ รวมถึงการตั้งค่าความปลอดภัย", 
      permissions: ["All Access", "Manage Users", "Manage Database"] 
    },
    { 
      name: "Manager", 
      desc: "จัดการใบแจ้งหนี้ ใบเสนอราคา และคลังสินค้า", 
      permissions: ["Quotations", "Invoices", "Inventory", "Contacts"] 
    },
    { 
      name: "Sales (ฝ่ายขาย)", 
      desc: "จัดการลูกค้าและใบเสนอราคาสำหรับปิดการขาย", 
      permissions: ["View Inventory", "Create Quotations", "Manage Contacts"] 
    },
    { 
      name: "Service (ฝ่ายบริการ)", 
      desc: "จัดการข้อมูลผู้ติดต่อและรับเรื่องแจ้งซ่อม", 
      permissions: ["View Contacts", "Support Tickets"] 
    },
    { 
      name: "Stock (ฝ่ายคลังสินค้า)", 
      desc: "จัดการนำเข้า/ส่งออกสินค้า เช็คสต็อก ตัดสต็อก", 
      permissions: ["Manage Inventory", "Stock Adjustments"] 
    },
    { 
      name: "Finance (ฝ่ายการเงิน)", 
      desc: "จัดการใบแจ้งหนี้ การชำระเงิน และออกใบเสร็จรับเงิน", 
      permissions: ["Manage Invoices", "Process Payments", "Tax Reports"] 
    },
    { 
      name: "Production (ฝ่ายผลิต)", 
      desc: "เบิกจ่ายวัตถุดิบและยืนยันการผลิตเข้าคลังสินค้า", 
      permissions: ["View Inventory", "Production Orders"] 
    },
    { 
      name: "Dev / Debugger", 
      desc: "กลุ่มพิเศษสำหรับทดสอบระบบ (Bypass สิทธิ์ปกติ)", 
      permissions: ["System Logs", "Test Mode", "API Access", "Bypass Rules"] 
    },
    { 
      name: "Staff", 
      desc: "ดูข้อมูลคลังสินค้าเบื้องต้น", 
      permissions: ["View Inventory"] 
    },
  ];

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
               <ShieldCheck className="text-blue-600" /> จัดการสิทธิ์ (Role & Permissions)
            </h1>
            <p className="text-gray-500 text-sm mt-1">กำหนดสิทธิ์การเข้าถึงเมนูต่างๆ ตามบทบาทผู้ใช้งาน</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
           {roles.map((role, idx) => (
              <div key={idx} className="bg-white rounded shadow-sm border border-gray-200 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                 <div className="p-6 flex-1">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 border border-gray-100">
                       <Lock size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{role.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-6">{role.desc}</p>
                    
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enabled Permissions</p>
                       <div className="flex flex-wrap gap-2">
                          {role.permissions.map((p, pIdx) => (
                             <span key={pIdx} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100">
                                <CheckCircle2 size={10} /> {p}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                    <button className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                       <Edit size={14} /> แก้ไขสิทธิ์
                    </button>
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                       <Trash2 size={16} />
                    </button>
                 </div>
              </div>
           ))}
        </div>

        {/* Permission Matrix Preview */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
           <div className="bg-gray-800 text-white px-8 py-4 flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
              <Eye size={16} className="text-blue-400" /> Permission Matrix (Preview)
           </div>
           <div className="p-8">
              <p className="text-sm text-gray-500 italic">
                 ระบบจัดการสิทธิ์แบบละเอียด (Granular Access Control) กำลังถูกพัฒนาเพื่อเชื่อมโยงกับระบบหลังบ้าน 
                 Neon RBAC ในรุ่นถัดไป
              </p>
           </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-xs font-medium">
           © 2026 Microtronic Thailand. Security Shield v2.1
        </div>
      </div>
    </main>
  );
}
