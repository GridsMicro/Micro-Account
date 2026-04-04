"use client";

import { useState } from "react";
import { 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Database,
  Save,
  ShieldCheck,
  Briefcase,
  Percent,
  Coins,
  FileDigit,
  CloudUpload,
  Cloud
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCompanySettings } from "@/app/actions";
import { useRouter } from "next/navigation";

const menuItems = [
  { id: 'company', icon: Building2, label: "ข้อมูลบริษัท (Profile)" },
  { id: 'tax', icon: ShieldCheck, label: "ข้อมูลภาษี (Tax Info)" },
  { id: 'bank', icon: Briefcase, label: "บัญชีธนาคาร (Bank)" },
  { id: 'rd-api', icon: CloudUpload, label: "RD API Portal" },
  { id: 'google-drive', icon: Cloud, label: "Google Drive (OAuth2)" },
  { id: 'system', icon: Database, label: "ฐานข้อมูล (System)" },
];

export default function SettingsClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    tax_id: initialData?.tax_id || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    bank_name: initialData?.bank_name || "",
    bank_account_name: initialData?.bank_account_name || "",
    bank_account_number: initialData?.bank_account_number || "",
    bank_branch: initialData?.bank_branch || "",
    vat_rate: initialData?.vat_rate || 7,
    withholding_tax_rate: initialData?.withholding_tax_rate || 3,
    is_vat_registered: initialData?.is_vat_registered ?? true,
    currency: initialData?.currency || "THB",
    invoice_prefix: initialData?.invoice_prefix || "INV",
    quotation_prefix: initialData?.quotation_prefix || "QT",
    receipt_prefix: initialData?.receipt_prefix || "REC",
    journal_prefix: initialData?.journal_prefix || "GJ",
    // Footer Notes
    invoice_footer: initialData?.invoice_footer || "",
    quotation_footer: initialData?.quotation_footer || "",
    receipt_footer: initialData?.receipt_footer || "",
    // RD API Settings
    rd_client_id: initialData?.rd_client_id || "",
    rd_client_secret: initialData?.rd_client_secret || "",
    rd_api_key: initialData?.rd_api_key || "",
    rd_base_url: initialData?.rd_base_url || "https://api-portal.rd.go.th",
    rd_enabled: initialData?.rd_enabled ?? false,
    // Google Drive OAuth2 Settings
    google_client_id: initialData?.google_client_id || "",
    google_client_secret: initialData?.google_client_secret || "",
    google_refresh_token: initialData?.google_refresh_token || "",
    google_redirect_uri: initialData?.google_redirect_uri || "https://developers.google.com/oauthplayground",
    google_drive_enabled: initialData?.google_drive_enabled ?? false,
  });

  const handleSave = async () => {
    setLoading(true);
    const res = await updateCompanySettings(formData);
    setLoading(false);
    if (res.success) {
      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      router.refresh();
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Navigation Card */}
      <div className="lg:col-span-1">
         <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
               <h3 className="font-bold text-gray-700 text-sm italic uppercase tracking-widest text-[10px]">Settings Menu</h3>
            </div>
            <nav className="p-2 space-y-1">
               {menuItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={cn(
                     "w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all",
                     activeTab === item.id 
                       ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                       : "text-gray-600 hover:bg-gray-100"
                   )}
                 >
                   <item.icon size={18} />
                   {item.label}
                 </button>
               ))}
            </nav>
         </div>
      </div>

      {/* Content Area Card */}
      <div className="lg:col-span-3">
         <div className="bg-white rounded shadow-sm border border-gray-200 min-h-[550px] flex flex-col">
            <div className="bg-gray-50 px-8 py-5 border-b border-gray-200 flex justify-between items-center">
               <h3 className="font-bold text-gray-800 text-lg uppercase tracking-tight">
                  {menuItems.find(m => m.id === activeTab)?.label}
               </h3>
               <button 
                onClick={handleSave}
                disabled={loading}
                className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded flex items-center gap-2 text-sm transition-all shadow-sm disabled:opacity-50"
               >
                  <Save size={16} /> {loading ? "กำลังบันทึก..." : "บันทึกข้อมูลส่วนนี้"}
               </button>
            </div>

            <div className="p-10 flex-1">
               {activeTab === 'company' && (
                 <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'ชื่อบริษัท (ไทย)'}</label>
                          <input 
                            type="text" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700 shadow-inner" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'TAX ID (เลขที่ผู้เสียภาษี)'}</label>
                          <input 
                            type="text" 
                            value={formData.tax_id} 
                            onChange={e => setFormData({...formData, tax_id: e.target.value})}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700 shadow-inner" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'เบอร์โทรศัพท์'}</label>
                          <input 
                            type="text" 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700 shadow-inner" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'อีเมลติดต่อ'}</label>
                          <input 
                            type="email" 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700 shadow-inner" 
                          />
                       </div>
                       <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'ที่อยู่จดทะเบียน (Address)'}</label>
                          <textarea 
                            rows={4} 
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700 shadow-inner resize-none leading-relaxed"
                          ></textarea>
                       </div>
                    </div>
                 </div>
               )}

               {activeTab === 'tax' && (
                  <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded flex items-center gap-4 mb-6">
                        <ShieldCheck className="text-blue-500" size={32} />
                        <div>
                            <p className="text-blue-800 font-bold text-sm">{'การจัดตั้งภาษี (VAT/WHT)'}</p>
                            <p className="text-blue-600 text-xs italic">{'กำหนดค่ามาตรฐานสำหรับการออกเอกสารใบแจ้งหนี้และใบเสนอราคา'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-100">
                           <input 
                             type="checkbox" 
                             id="vat_reg"
                             checked={formData.is_vat_registered}
                             onChange={e => setFormData({...formData, is_vat_registered: e.target.checked})}
                             className="w-5 h-5 rounded text-blue-600" 
                           />
                           <label htmlFor="vat_reg" className="text-sm font-bold text-gray-700">จดทะเบียนภาษีมูลค่าเพิ่ม (VAT Registered)</label>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                             <Percent size={10} /> อัตราภาษีมูลค่าเพิ่ม (%)
                          </label>
                          <input 
                            type="number" 
                            value={formData.vat_rate} 
                            onChange={e => setFormData({...formData, vat_rate: Number(e.target.value)})}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                             <Percent size={10} /> ภาษีหัก ณ ที่จ่าย (%)
                          </label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={formData.withholding_tax_rate} 
                            onChange={e => setFormData({...formData, withholding_tax_rate: Number(e.target.value)})}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                          />
                        </div>
                    </div>
                  </div>
               )}

               {activeTab === 'bank' && (
                  <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'ชื่อธนาคาร'}</label>
                           <input 
                             type="text" 
                             value={formData.bank_name} 
                             onChange={e => setFormData({...formData, bank_name: e.target.value})}
                             placeholder={'เช่น ธนาคารกสิกรไทย'}
                             className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'สาขา'}</label>
                           <input 
                             type="text" 
                             value={formData.bank_branch} 
                             onChange={e => setFormData({...formData, bank_branch: e.target.value})}
                             className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'ชื่อบัญชี'}</label>
                           <input 
                             type="text" 
                             value={formData.bank_account_name} 
                             onChange={e => setFormData({...formData, bank_account_name: e.target.value})}
                             className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{'เลขที่บัญชี'}</label>
                           <input 
                             type="text" 
                             value={formData.bank_account_number} 
                             onChange={e => setFormData({...formData, bank_account_number: e.target.value})}
                             className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700 tracking-widest" 
                           />
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'rd-api' && (
                  <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded flex items-center gap-4 mb-6">
                        <CloudUpload className="text-orange-500" size={32} />
                        <div>
                            <p className="text-orange-800 font-bold text-sm">{'กรมสรรพากร API (RD Portal)'}</p>
                            <p className="text-orange-600 text-xs italic">{'เชื่อมต่อกระบวนการยื่นภาษีอัตโนมัติกับกรมสรรพากร'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-100">
                           <input 
                             type="checkbox" 
                             id="rd_enabled"
                             checked={formData.rd_enabled}
                             onChange={e => setFormData({...formData, rd_enabled: e.target.checked})}
                             className="w-5 h-5 rounded text-blue-600" 
                           />
                           <label htmlFor="rd_enabled" className="text-sm font-bold text-gray-700">เปิดใช้งาน RD API</label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">RD Client ID</label>
                             <input 
                               type="text" 
                               value={formData.rd_client_id} 
                               onChange={e => setFormData({...formData, rd_client_id: e.target.value})}
                               className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">RD Client Secret</label>
                             <input 
                               type="password" 
                               value={formData.rd_client_secret} 
                               onChange={e => setFormData({...formData, rd_client_secret: e.target.value})}
                               className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                             />
                           </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">RD API Key</label>
                          <input 
                            type="text" 
                            value={formData.rd_api_key} 
                            onChange={e => setFormData({...formData, rd_api_key: e.target.value})}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">RD Base URL</label>
                          <input 
                            type="text" 
                            value={formData.rd_base_url} 
                            onChange={e => setFormData({...formData, rd_base_url: e.target.value})}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                          />
                        </div>
                    </div>
                  </div>
               )}

               {activeTab === 'google-drive' && (
                  <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded flex items-center gap-4 mb-6">
                        <Cloud className="text-blue-500" size={32} />
                        <div>
                            <p className="text-blue-800 font-bold text-sm">{'Google Drive OAuth2 Configuration'}</p>
                            <p className="text-blue-600 text-xs italic">{'กำหนดค่าการเชื่อมต่อ Google Drive สำหรับเก็บไฟล์เอกสาร'}</p>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
                        <p className="text-yellow-800 text-sm font-bold mb-2">ขั้นตอนการขอ OAuth2 Credentials:</p>
                        <ol className="text-yellow-700 text-xs list-decimal list-inside space-y-1">
                            <li>ไปที่ <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="underline">Google Cloud Console</a></li>
                            <li>สร้าง Project ใหม่ หรือเลือก Project ที่มีอยู่</li>
                            <li>เปิดใช้งาน Google Drive API</li>
                            <li>ไปที่ Credentials → Create Credentials → OAuth 2.0 Client ID</li>
                            <li>เลือก Application type: Web application</li>
                            <li>ใส่ Authorized redirect URI: <code>https://developers.google.com/oauthplayground</code></li>
                            <li>คัดลอก Client ID และ Client Secret มาใส่ด้านล่าง</li>
                            <li>ไปที่ <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="underline">OAuth2 Playground</a> เพื่อขอ Refresh Token</li>
                        </ol>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-100">
                           <input 
                             type="checkbox" 
                             id="google_drive_enabled"
                             checked={formData.google_drive_enabled}
                             onChange={e => setFormData({...formData, google_drive_enabled: e.target.checked})}
                             className="w-5 h-5 rounded text-blue-600" 
                           />
                           <label htmlFor="google_drive_enabled" className="text-sm font-bold text-gray-700">เปิดใช้งาน Google Drive OAuth2 (แทน Service Account)</label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Google Client ID</label>
                             <input 
                               type="text" 
                               value={formData.google_client_id} 
                               onChange={e => setFormData({...formData, google_client_id: e.target.value})}
                               placeholder="xxxxx.apps.googleusercontent.com"
                               className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Google Client Secret</label>
                             <input 
                               type="password" 
                               value={formData.google_client_secret} 
                               onChange={e => setFormData({...formData, google_client_secret: e.target.value})}
                               placeholder="GOCSPX-xxxxx"
                               className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                             />
                           </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Refresh Token</label>
                          <textarea 
                            rows={3}
                            value={formData.google_refresh_token} 
                            onChange={e => setFormData({...formData, google_refresh_token: e.target.value})}
                            placeholder="1//xxxxx-xxxxxx..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700 resize-none font-mono"
                          />
                          <p className="text-xs text-gray-500">Refresh Token ใช้สำหรับเข้าถึง Google Drive โดยไม่ต้อง Login ซ้ำ</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Redirect URI</label>
                          <input 
                            type="text" 
                            value={formData.google_redirect_uri} 
                            onChange={e => setFormData({...formData, google_redirect_uri: e.target.value})}
                            placeholder="https://developers.google.com/oauthplayground"
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                          />
                        </div>
                    </div>
                  </div>
               )}

               {activeTab === 'system' && (
                  <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                              <Coins size={10} /> {'สกุลเงินหลัก (Currency)'}
                           </label>
                           <select 
                             value={formData.currency}
                             onChange={e => setFormData({...formData, currency: e.target.value})}
                             className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700"
                           >
                              <option value="THB text-gray-700 font-bold">THB - {'บาทไทย'}</option>
                              <option value="USD text-gray-700 font-bold">USD - {'ดอลลาร์สหรัฐ'}</option>
                           </select>
                        </div>
                        
                        <div className="md:col-span-2">
                           <h4 className="text-xs font-black text-blue-600 mb-4 uppercase tracking-widest border-b border-blue-50 pb-2">DOCUMENT NUMBERING</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FileDigit size={10} /> Invoice Prefix
                                 </label>
                                 <input 
                                   type="text" 
                                   value={formData.invoice_prefix} 
                                   onChange={e => setFormData({...formData, invoice_prefix: e.target.value})}
                                   className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FileDigit size={10} /> Quotation Prefix
                                 </label>
                                 <input 
                                   type="text" 
                                   value={formData.quotation_prefix} 
                                   onChange={e => setFormData({...formData, quotation_prefix: e.target.value})}
                                   className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FileDigit size={10} /> Receipt Prefix
                                 </label>
                                 <input 
                                   type="text" 
                                   value={formData.receipt_prefix} 
                                   onChange={e => setFormData({...formData, receipt_prefix: e.target.value})}
                                   className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FileDigit size={10} /> Journal Prefix
                                 </label>
                                 <input 
                                   type="text" 
                                   value={formData.journal_prefix} 
                                   onChange={e => setFormData({...formData, journal_prefix: e.target.value})}
                                   className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                                 />
                              </div>
                           </div>
                        </div>
                        
                        <div className="md:col-span-2">
                           <h4 className="text-xs font-black text-blue-600 mb-4 uppercase tracking-widest border-b border-blue-50 pb-2">FOOTER NOTES</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FileDigit size={10} /> Invoice Footer
                                 </label>
                                 <textarea 
                                   value={formData.invoice_footer} 
                                   onChange={e => setFormData({...formData, invoice_footer: e.target.value})}
                                   className="w-full h-20 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                                   placeholder="Enter invoice footer text..."
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FileDigit size={10} /> Quotation Footer
                                 </label>
                                 <textarea 
                                   value={formData.quotation_footer} 
                                   onChange={e => setFormData({...formData, quotation_footer: e.target.value})}
                                   className="w-full h-20 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                                   placeholder="Enter quotation footer text..."
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <FileDigit size={10} /> Receipt Footer
                                 </label>
                                 <textarea 
                                   value={formData.receipt_footer} 
                                   onChange={e => setFormData({...formData, receipt_footer: e.target.value})}
                                   className="w-full h-20 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                                   placeholder="Enter receipt footer text..."
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
            
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center justify-between">
               <span>System Hash: {initialData?.id ? `CFG-${initialData.id}-OK` : 'NEW-CONFIG'}</span>
               <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Database Sync: Active
               </span>
            </div>
         </div>
      </div>

    </div>
  );
}
