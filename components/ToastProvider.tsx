"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`
              pointer-events-auto flex items-center justify-between gap-4 p-4 rounded-2xl border shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500
              ${toast.type === 'success' ? 'bg-slate-900 border-emerald-500/30 text-emerald-400' : ''}
              ${toast.type === 'error' ? 'bg-slate-900 border-rose-500/30 text-rose-400' : ''}
              ${toast.type === 'info' ? 'bg-slate-900 border-indigo-500/30 text-indigo-400' : ''}
            `}
          >
            <div className="flex items-center gap-3">
               {toast.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
               {toast.type === 'error' && <AlertCircle size={20} className="shrink-0" />}
               {toast.type === 'info' && <Info size={20} className="shrink-0" />}
               <span className="text-[12px] font-black uppercase tracking-widest">{toast.message}</span>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
            >
               <X size={14} className="opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
