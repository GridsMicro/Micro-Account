"use client";

import { useState, useCallback, useRef } from "react";
import { FolderOpen, X, ExternalLink, CheckCircle, Upload, MonitorUp } from "lucide-react";
import { uploadToGoogleDrive } from "@/app/actions";

interface GoogleDrivePickerProps {
  value?: string;
  onChange: (url: string, fileName: string) => void;
  onClear: () => void;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
    onGoogleApiLoad?: () => void;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

export default function GoogleDrivePicker({ value, onChange, onClear }: GoogleDrivePickerProps) {
  const [loading, setLoading] = useState(false);
  const [pickerFileName, setPickerFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ฟังก์ชันอัปโหลดจากเครื่อง ---
  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await uploadToGoogleDrive(base64, file.name, file.type);
        
        if (res.success && res.url) {
          setPickerFileName(file.name);
          onChange(res.url, file.name);
        } else {
          alert("❌ อัปโหลดไม่สำเร็จ: " + res.error);
        }
        setLoading(false);
      };
    } catch (err) {
      console.error("Local upload error:", err);
      setLoading(false);
    }
  };

  const loadGoogleAPIs = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (window.gapi && window.google) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load("client:picker", () => resolve());
      };
      document.head.appendChild(script);
    });
  }, []);

  const openPicker = useCallback(async () => {
    if (!CLIENT_ID || !API_KEY) {
      alert("ยังไม่ได้ตั้งค่า Google Client ID ติดต่อผู้ดูแลระบบ");
      return;
    }

    setLoading(true);

    try {
      await loadGoogleAPIs();

      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      });

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            setLoading(false);
            return;
          }

          const picker = new window.google.picker.PickerBuilder()
            .addView(
              new window.google.picker.DocsView()
                .setIncludeFolders(false)
                .setMimeTypes("application/pdf,image/jpeg,image/png,image/webp")
            )
            .setOAuthToken(tokenResponse.access_token)
            .setDeveloperKey(API_KEY)
            .setTitle("เลือกไฟล์ใบเสร็จ / บิล จาก Google Drive")
            .setCallback((data: any) => {
              setLoading(false);
              if (data.action === window.google.picker.Action.PICKED) {
                const file = data.docs[0];
                const url = `https://drive.google.com/file/d/${file.id}/view`;
                setPickerFileName(file.name);
                onChange(url, file.name);
              }
            })
            .build();

          picker.setVisible(true);
        },
      });

      tokenClient.requestAccessToken({ prompt: "" });
    } catch (err) {
      console.error("Google Picker error:", err);
      setLoading(false);
    }
  }, [loadGoogleAPIs, onChange]);

  if (value) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 shadow-sm animate-in zoom-in-95">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
          <CheckCircle size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-green-900 truncate">
            {pickerFileName || "เตรียมพร้อมใช้งาน"}
          </p>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-0.5 font-bold underline decoration-blue-200"
          >
            <ExternalLink size={10} /> ตรวจสอบไฟล์บน Cloud Storage
          </a>
        </div>
        <button
          type="button"
          onClick={() => { onClear(); setPickerFileName(""); }}
          className="w-8 h-8 flex items-center justify-center text-red-300 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition-all"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLocalUpload}
          className="hidden"
          accept="image/*,application/pdf"
        />

        {/* Local Machine Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex-1 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <MonitorUp size={20} />
          )}
          {loading ? "กำลังอัพโหลดเข้าระบบ..." : "อัพโหลดจากเครื่องคอมพิวเตอร์"}
        </button>

        {/* Google Drive Picker */}
        <button
          type="button"
          onClick={openPicker}
          disabled={loading}
          className="flex-1 h-14 bg-white border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all disabled:opacity-50"
        >
          <FolderOpen size={20} />
          เลือกจากไฟล์ใน Google Drive
        </button>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within:text-blue-500 transition-colors">
          <Upload size={14} />
        </div>
        <input
          type="url"
          placeholder="หรือวาง URL ลิงค์ไฟล์ตรงนี้เพื่ออ้างอิง..."
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value, "Link อ้างอิงภายนอก");
          }}
          className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all italic text-gray-500 shadow-inner"
        />
      </div>
    </div>
  );
}
