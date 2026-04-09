"use client";
import { useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Bot, Sparkles, X, BrainCircuit, Zap, Send, ChevronDown, ChevronUp } from "lucide-react";

export default function GlobalAiChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await axios.post("/api/ai/accounting", { prompt });
      setAnswer(res.data.answer);
      setMinimized(false); 
    } catch (err: any) {
      setError(err.response?.data?.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🚀 Floating Trigger Button (Dragon Core) */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-500 active:scale-95 group bg-slate-900 border border-white/10 text-white overflow-hidden hover:shadow-[0_0_40px_rgba(124,58,237,0.4)] hover:-translate-y-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-blue-600/20 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="relative">
              <BrainCircuit className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]"></div>
            </div>
            <div className="flex flex-col items-start leading-none gap-1 text-left">
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">Micro-Systems</span>
              <span className="text-sm font-black tracking-tighter uppercase">Dragon AI</span>
            </div>
          </div>
        </button>
      )}

      {/* 🔮 Side Assistant Window */}
      {open && (
        <div 
          className={cn(
            "fixed z-[60] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden",
            minimized 
              ? "bottom-8 right-8 w-80 h-20 rounded-xl bg-slate-900/95 backdrop-blur-xl" 
              : "top-4 right-4 bottom-4 w-[450px] rounded-xl bg-slate-900 animate-in slide-in-from-right duration-500"
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 shrink-0 transition-all",
            minimized ? "p-4 h-full" : "p-8"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xl transition-all",
                minimized ? "w-10 h-10" : "w-14 h-14 rotate-6"
              )}>
                <Bot size={minimized ? 22 : 30} className={loading ? "animate-spin" : "animate-pulse"} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-black text-white tracking-widest uppercase truncate max-w-[150px]">Dragon AI</h2>
                {!minimized && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">NEURAL ENGINE</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMinimized(!minimized)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all text-slate-400 active:scale-90 border border-white/5"
              >
                {minimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              <button 
                onClick={() => setOpen(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all text-slate-400 active:scale-90 border border-white/5"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* 💬 Chat History - ย้ายมาไว้ข้างบนและให้ Scroll ได้ */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar subpixel-antialiased">
                {answer ? (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.5em]">Dragon Intelligence Output</span>
                    </div>
                    <div className="p-6 bg-slate-950/40 border border-white/5 rounded-lg text-slate-300 leading-relaxed text-sm">
                      <div className="prose prose-invert prose-sm max-w-none">
                        {answer}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                    <BrainCircuit size={48} className="mb-4 text-slate-500" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Waiting for your query...</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold flex items-center gap-3">
                    <Zap size={16} />
                    <span>SYSTEM ERROR: {error}</span>
                  </div>
                )}
              </div>

              {/* ⌨️ Keyboard Input Area - ย้ายมาไว้ด้านล่าง */}
              <div className="p-6 bg-slate-950/20 border-t border-white/5">
                <form onSubmit={submit} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/10 to-blue-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Quick Prompts */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button 
                      type="button"
                      onClick={() => setPrompt("ทุนสินค้า 10,000 บาท จ้างคน 2,000 บาท หัก WHT 3% แล้วควรตั้งราคาขายเท่าไหร่ให้บริษัทมีกำไร 35%?")}
                      className="text-[9px] font-bold text-violet-300 bg-violet-600/20 hover:bg-violet-600/40 px-3 py-1.5 rounded border border-violet-500/20 transition-colors"
                    >
                      ช่วยคำนวณราคาขาย (Smart Pricing)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPrompt("การหักภาษี ณ ที่จ่าย 3% (ทวิ 50) สำหรับโมเดล Service มีลอจิกบัญชียังไง?")}
                      className="text-[9px] font-bold text-emerald-300 bg-emerald-600/20 hover:bg-emerald-600/40 px-3 py-1.5 rounded border border-emerald-500/20 transition-colors"
                    >
                      ลอจิกภาษี 3% หัก ณ ที่จ่าย
                    </button>
                  </div>

                  <div className="relative space-y-3">
                    <textarea
                      className="w-full p-4 bg-slate-950 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/50 text-white placeholder:text-slate-700 transition-all resize-none text-sm leading-relaxed"
                      rows={2}
                      placeholder="พิมพ์คำถามของคุณที่นี่..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading || !prompt.trim()}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-lg shadow-xl disabled:opacity-30 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="text-[10px] uppercase tracking-[0.2em]">Send Command</span>
                          <Send size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 🏁 Footer */}
              <div className="px-6 py-4 bg-slate-950/50 flex items-center justify-center gap-3">
                <div className="w-1 h-1 bg-violet-500 rounded-full"></div>
                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.4em] italic leading-none">Status: Neural Engine Online</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
