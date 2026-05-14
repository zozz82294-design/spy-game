import { useState } from "react";
import { Search, LogOut, Loader2 } from "lucide-react";

export default function SpyGuess({ state, me, isHost, send, onLeave, playerId, isDesktop }) {
  const amISpy = state.role_for_viewer === "spy";
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);
    send({ type: "spy_guess", guess: selected });
  };

  if (!amISpy) {
    return (
      <div className="flex flex-col flex-1 p-5 pt-8 items-center justify-center text-center" data-testid="spy-guess-waiting">
        <div className="fade-up">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <h2 className="font-kufam font-black text-2xl text-white mb-2">في انتظار الجاسوس</h2>
          <p className="text-slate-400">{state.spy_name} يحاول تخمين الكلمة من 30 خياراً...</p>
        </div>
        <button
          onClick={onLeave}
          data-testid="leave-btn"
          className="mt-auto w-full bg-transparent border-2 border-red-900/60 text-red-400 hover:bg-red-950/30 rounded-xl h-12 px-4 font-bold flex items-center justify-center gap-2 font-kufam"
        >
          <LogOut className="w-4 h-4" />
          مغادرة
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-5 pt-6" data-testid="spy-guess-screen">
      <div className="text-center mb-5 fade-up">
        <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/30 rounded-full px-4 py-1.5 mb-3">
          <Search className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold text-red-400 tracking-wider">فرصة الجاسوس</span>
        </div>
        <h2 className="font-kufam font-black text-2xl text-white">خمّن الكلمة</h2>
        <p className="text-slate-400 text-sm mt-1">تصنيف: {state.category} • 30 خياراً</p>
      </div>

      <div className={`grid ${isDesktop ? "grid-cols-5" : "grid-cols-2"} gap-2 fade-up`} style={{ animationDelay: "0.1s" }}>
        {state.spy_guess_options.map((w, idx) => (
          <button
            key={idx}
            onClick={() => !submitted && setSelected(w)}
            disabled={submitted}
            data-testid={`guess-option-${idx}`}
            className={`px-3 py-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
              selected === w
                ? "bg-red-600 border-red-700 text-white"
                : "bg-slate-800/60 border-slate-700 text-slate-200 hover:border-red-500"
            } ${submitted ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="pt-6 mt-auto space-y-3 sticky bottom-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10] to-transparent pb-2 -mx-5 px-5">
        <button
          onClick={submit}
          disabled={!selected || submitted}
          data-testid="submit-guess-btn"
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 text-white rounded-xl h-16 px-6 text-xl font-black border-b-4 border-red-900 disabled:border-b-2 active:border-b-0 active:translate-y-1 btn-press flex items-center justify-center gap-2 font-kufam"
        >
          {submitted ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          {submitted ? "جاري الإرسال..." : selected ? `تأكيد: ${selected}` : "اختر كلمة"}
        </button>
        <button
          onClick={onLeave}
          data-testid="leave-btn"
          className="w-full bg-transparent border-2 border-red-900/60 text-red-400 hover:bg-red-950/30 rounded-xl h-12 px-4 font-bold flex items-center justify-center gap-2 font-kufam"
        >
          <LogOut className="w-4 h-4" />
          مغادرة
        </button>
      </div>
    </div>
  );
}
