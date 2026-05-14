import { useState } from "react";
import { Eye, EyeOff, ShieldAlert, Vote, LogOut, Tag } from "lucide-react";

export default function RoleReveal({ state, isHost, send, onLeave }) {
  const [shown, setShown] = useState(false);
  const isSpy = state.role_for_viewer === "spy";

  return (
    <div className="flex flex-col flex-1 p-5 pt-8" data-testid="reveal-screen">
      <div className="text-center fade-up">
        <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5">
          <Tag className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400 tracking-wider">{state.category}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center -mt-4">
        {!shown ? (
          <button
            onClick={() => setShown(true)}
            data-testid="reveal-card-btn"
            className="w-full max-w-xs aspect-[3/4] bg-gradient-to-br from-[#1F2833] to-slate-900 border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-red-500 transition-all active:scale-95 fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <Eye className="w-16 h-16 text-slate-500" strokeWidth={1.5} />
            <span className="font-kufam font-black text-2xl text-white">دورك</span>
            <span className="text-slate-400 text-sm">اضغط لمعرفة دورك</span>
          </button>
        ) : (
          <div
            data-testid="role-reveal-card"
            className={`w-full max-w-xs aspect-[3/4] rounded-3xl flex flex-col items-center justify-center gap-3 p-6 fade-up ${
              isSpy
                ? "bg-gradient-to-br from-red-900 via-red-800 to-slate-900 border-2 border-red-600 spy-pulse"
                : "bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-500/40"
            }`}
          >
            {isSpy ? (
              <>
                <ShieldAlert className="w-16 h-16 text-red-300" strokeWidth={2} />
                <span className="font-kufam font-black text-4xl text-white text-center leading-tight">
                  أنت
                  <br />
                  الجاسوس
                </span>
                <p className="text-red-200 text-sm text-center mt-2">
                  حاول معرفة الكلمة من خلال الأسئلة دون أن يكتشفك أحد
                </p>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-yellow-400 tracking-widest">الكلمة</span>
                <span className="font-kufam font-black text-4xl text-yellow-400 word-glow text-center leading-tight" data-testid="word-display">
                  {state.word_for_viewer}
                </span>
                <p className="text-slate-400 text-sm text-center mt-3" data-testid="category-hint">
                  تصنيف الكلمة: <span className="text-yellow-300 font-bold">{state.category}</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 space-y-3">
        {shown && (
          <button
            onClick={() => setShown(false)}
            data-testid="hide-role-btn"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl h-12 px-4 font-bold border-2 border-slate-700 flex items-center justify-center gap-2"
          >
            <EyeOff className="w-4 h-4" />
            إخفاء
          </button>
        )}
        {isHost && (
          <button
            onClick={() => send({ type: "start_voting" })}
            data-testid="start-voting-btn"
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-16 px-6 text-xl font-black border-b-4 border-red-900 active:border-b-0 active:translate-y-1 btn-press flex items-center justify-center gap-2 font-kufam"
          >
            <Vote className="w-5 h-5" />
            بدء التصويت
          </button>
        )}
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
