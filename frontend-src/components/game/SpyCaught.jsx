import { ShieldAlert, ShieldCheck, Search, LogOut, Eye } from "lucide-react";

export default function SpyCaught({ state, me, isHost, send, onLeave, playerId }) {
  const iAmSpy = state.role_for_viewer === "spy" || playerId === state.most_voted_id && false; // we determine via role
  const isSpyViewer = playerId && state.players.find(p => p.id === playerId)?.is_host === false || true;
  // We rely on backend: role_for_viewer tells us
  const amISpy = state.role_for_viewer === "spy";
  const spyCaught = state.spy_caught;

  const proceedToGuess = () => {
    // Spy proceeds to guess automatically by setting state via host? No, we let state advance automatically based on host trigger.
    // Actually backend already set state to spy_caught. We add a "Continue" button visible to host.
  };

  const goGuess = () => {
    // Host triggers spy_guess phase by sending a message
    send({ type: "spy_guess_phase" });
  };

  return (
    <div className="flex flex-col flex-1 p-5 pt-8" data-testid="spy-caught-screen">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        {amISpy ? (
          // Spy's view
          <div className="fade-up w-full">
            {spyCaught ? (
              <>
                <div className="w-24 h-24 rounded-2xl bg-red-600/20 border-2 border-red-600 flex items-center justify-center mx-auto mb-5 spy-pulse">
                  <ShieldAlert className="w-12 h-12 text-red-400" />
                </div>
                <h2 className="font-kufam font-black text-3xl text-white mb-3">تم اكتشاف أنك الجاسوس</h2>
                <p className="text-slate-400 mb-6">لكن لديك فرصة أخيرة... خمّن الكلمة الصحيحة لتفوز.</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-2xl bg-emerald-600/20 border-2 border-emerald-600 flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="font-kufam font-black text-3xl text-white mb-3">لقد تخفّيت بنجاح</h2>
                <p className="text-slate-400 mb-2">تم طرد الشخص الخطأ</p>
                <p className="text-yellow-400 font-bold mb-6">والآن... خمّن الكلمة لتحقق فوزاً مزدوجاً</p>
              </>
            )}
            <button
              onClick={goGuess}
              data-testid="guess-word-btn"
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-16 px-6 text-xl font-black border-b-4 border-red-900 active:border-b-0 active:translate-y-1 btn-press flex items-center justify-center gap-2 font-kufam"
            >
              <Search className="w-5 h-5" />
              تخمين الكلمة
            </button>
          </div>
        ) : (
          // Civilian / Host view
          <div className="fade-up">
            {spyCaught ? (
              <>
                <div className="w-24 h-24 rounded-2xl bg-emerald-600/20 border-2 border-emerald-600 flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="font-kufam font-black text-3xl text-white mb-3">صحيح!</h2>
                <p className="text-lg text-slate-300 mb-2">
                  <span className="text-red-400 font-bold">{state.most_voted_name}</span> هو الجاسوس فعلاً
                </p>
                <p className="text-slate-400 text-sm">بانتظار تخمينه للكلمة...</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-2xl bg-red-600/20 border-2 border-red-600 flex items-center justify-center mx-auto mb-5">
                  <Eye className="w-12 h-12 text-red-400" />
                </div>
                <h2 className="font-kufam font-black text-3xl text-white mb-3">لم يكن الجاسوس!</h2>
                <p className="text-lg text-slate-300 mb-2">
                  لقد طُرد مدني خطأ: <span className="text-yellow-400 font-bold">{state.most_voted_name}</span>
                </p>
                <p className="text-lg text-slate-300 mb-2">
                  الجاسوس هو: <span className="text-red-400 font-bold">{state.spy_name}</span>
                </p>
                <p className="text-slate-400 text-sm mt-3">بانتظار تخمينه للكلمة...</p>
              </>
            )}
          </div>
        )}
      </div>

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
