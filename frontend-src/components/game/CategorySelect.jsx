import { Tag, LogOut, Loader2 } from "lucide-react";

const CATEGORY_ICONS = {
  "أنمي": "🎌",
  "كرتون": "🧸",
  "دول": "🌍",
  "أماكن": "📍",
  "أكل": "🍽️",
  "رياضة": "⚽",
  "ألعاب": "🎮",
  "حيوانات": "🐾",
  "أدوات كهربائية": "💡",
  "مهن ووظائف": "💼",
  "وسائل مواصلات": "🚗",
  "ملابس": "👕",
};

export default function CategorySelect({ state, isHost, send, onLeave, isDesktop }) {
  const cats = state.categories?.length ? state.categories : Object.keys(CATEGORY_ICONS);

  return (
    <div className="flex flex-col flex-1 p-5 pt-6" data-testid="category-screen">
      <div className="text-center mb-6 fade-up">
        <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/30 rounded-full px-4 py-1.5 mb-3">
          <Tag className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold text-red-400 tracking-wider">اختيار التصنيف</span>
        </div>
        <h2 className="font-kufam font-black text-3xl text-white">
          {isHost ? "اختر تصنيف اللعبة" : "بانتظار الهوست"}
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          {isHost ? "كل تصنيف يحتوي على 200 كلمة" : "الهوست يختار تصنيف الكلمة الآن..."}
        </p>
      </div>

      {!isHost && (
        <div className="flex-1 flex flex-col items-center justify-center fade-up">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
          <p className="text-slate-400">انتظر لحظات...</p>
        </div>
      )}

      {isHost && (
        <div className={`grid ${isDesktop ? "grid-cols-4" : "grid-cols-2"} gap-3 fade-up`} style={{ animationDelay: "0.1s" }}>
          {cats.map((cat, idx) => (
            <button
              key={cat}
              onClick={() => send({ type: "select_category", category: cat })}
              data-testid={`category-btn-${idx}`}
              className="bg-[#1F2833] hover:bg-slate-700 border-2 border-slate-700/60 hover:border-red-500 rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <div className="text-3xl">{CATEGORY_ICONS[cat] || "🏷️"}</div>
              <span className="font-kufam font-black text-base text-white group-hover:text-red-400 transition-colors">{cat}</span>
            </button>
          ))}
        </div>
      )}

      <div className="pt-6 mt-auto">
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
