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
      // อ่านไฟล์เป็น Base64
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
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded p-3">
        <CheckCircle size={18} className="text-green-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-green-800 truncate">
            {pickerFileName || "ไฟล์ที่เลือกไว้"}
          </p>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5 font-bold"
          >
            <ExternalLink size={10} /> เปิดดูไฟล์ที่เก็บไว้ใน Google Drive
          </a>
        </div>
        <button
          type="button"
          onClick={() => { onClear(); setPickerFileName(""); }}
          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
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
          className="flex-1 h-12 bg-white border-2 border-blue-600 rounded-xl flex items-center justify-center gap-2 text-sm font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <MonitorUp size={18} />
          )}
          {loading ? "กำลังอัพโหลด..." : "อัพโหลดจากเครื่อง"}
        </button>

        {/* Google Drive Picker */}
        <button
          type="button"
          onClick={openPicker}
          disabled={loading}
          className="flex-1 h-12 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-all disabled:opacity-50"
        >
          <FolderOpen size={18} />
          เลือกจาก Drive
        </button>
      </div>

      <div className="relative">
        <input
          type="url"
          placeholder="หรือวาง URL ลิงค์ไฟล์ตรงนี้..."
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value, "Link อ้างอิง");
          }}
          className="w-full h-11 px-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all italic"
        />
        <Upload size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}
