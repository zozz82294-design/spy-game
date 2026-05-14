import { Trophy, RotateCcw, LogOut, Sparkles } from "lucide-react";

export default function Result({ state, isHost, send, onLeave }) {
  // Determine outcome
  const spyGuessedRight = state.spy_final_guess && state.word_for_viewer && state.spy_final_guess === state.word_for_viewer;
  // The word_for_viewer is only shown to civilians; we need actual word. We'll display the final guess vs spy success indirectly.
  // For simplicity, the result message displays the spy's guess for everyone.

  return (
    <div className="flex flex-col flex-1 p-5 pt-6" data-testid="result-screen">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="fade-up w-full">
          <div className="w-24 h-24 rounded-2xl bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-12 h-12 text-yellow-400" />
          </div>
          <h2 className="font-kufam font-black text-3xl text-white mb-3">انتهت الجولة</h2>

          {state.spy_final_guess ? (
            <>
              <p className="text-slate-300 text-lg mb-3">
                خمّن الجاسوس الكلمة:
              </p>
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-700/10 border-2 border-yellow-500/50 rounded-2xl py-5 px-4 mb-4">
                <p className="font-kufam font-black text-3xl text-yellow-400 word-glow" data-testid="spy-final-guess">
                  {state.spy_final_guess}
                </p>
              </div>
            </>
          ) : (
            <p className="text-slate-300 text-lg mb-4">لم يخمّن الجاسوس بعد</p>
          )}

          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 mt-4">
            <p className="text-slate-400 text-sm mb-1">الجاسوس كان</p>
            <p className="font-kufam font-bold text-xl text-red-400" data-testid="final-spy-name">{state.spy_name}</p>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-auto space-y-3">
        {isHost && (
          <button
            onClick={() => send({ type: "restart_game" })}
            data-testid="play-again-btn"
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-16 px-6 text-xl font-black border-b-4 border-red-900 active:border-b-0 active:translate-y-1 btn-press flex items-center justify-center gap-2 font-kufam"
          >
            <RotateCcw className="w-5 h-5" />
            لعب مرة أخرى
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
