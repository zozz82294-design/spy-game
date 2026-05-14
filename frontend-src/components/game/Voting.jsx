import { Crown, Check, LogOut, Vote as VoteIcon } from "lucide-react";

export default function Voting({ state, me, isHost, send, onLeave, playerId }) {
  const myVote = state.players.find((p) => p.id === playerId);
  const hasVoted = myVote?.has_voted;

  return (
    <div className="flex flex-col flex-1 p-5 pt-6" data-testid="voting-screen">
      <div className="text-center mb-5 fade-up">
        <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/30 rounded-full px-4 py-1.5 mb-3">
          <VoteIcon className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold text-red-400 tracking-wider">جلسة التصويت</span>
        </div>
        <h2 className="font-kufam font-black text-3xl text-white mb-2">من هو الجاسوس؟</h2>
        <div className="flex items-center justify-center gap-2">
          <div className="bg-slate-800 border-2 border-slate-700 rounded-xl px-5 py-2">
            <span className="font-kufam font-black text-3xl text-white" data-testid="vote-counter">
              {state.vote_count}
              <span className="text-slate-500 mx-1">/</span>
              {state.total_voters}
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-2">
          {hasVoted ? "تم التصويت ✓ بانتظار الباقي" : "اختر لاعباً واحداً"}
        </p>
      </div>

      <div className="space-y-2 fade-up" style={{ animationDelay: "0.1s" }}>
        {state.players.map((p) => (
          <button
            key={p.id}
            onClick={() => !hasVoted && p.id !== playerId && send({ type: "vote", target_id: p.id })}
            disabled={hasVoted || p.id === playerId}
            data-testid={`vote-btn-${p.id}`}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              p.id === playerId
                ? "bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed"
                : hasVoted
                ? "bg-slate-800/30 border-slate-700/40 opacity-60 cursor-not-allowed"
                : "bg-slate-800/60 border-slate-700 hover:border-red-500 hover:bg-slate-800 active:scale-[0.98]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                p.is_host ? "bg-yellow-500 text-slate-900" : "bg-slate-700 text-slate-200"
              }`}>
                {p.is_host ? <Crown className="w-4 h-4" /> : <span className="font-bold">{p.name[0]}</span>}
              </div>
              <span className="font-bold text-white text-lg">{p.name}</span>
              {p.id === playerId && <span className="text-[10px] font-black text-slate-500 bg-slate-700/40 border border-slate-600 px-2 py-0.5 rounded">أنت (لا يمكنك التصويت على نفسك)</span>}
            </div>
            {p.has_voted && <Check className="w-5 h-5 text-emerald-400" />}
          </button>
        ))}
      </div>

      {/* Vote log */}
      {state.vote_log?.length > 0 && (
        <div className="mt-6 fade-up" style={{ animationDelay: "0.2s" }}>
          <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-2 px-1">سجل التصويت</h4>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1">
            {state.vote_log.map((entry, idx) => (
              <p key={idx} className="text-sm text-slate-400 slide-in" data-testid={`vote-log-${idx}`}>
                صوّت <span className="text-white font-bold">{entry.voter}</span> على <span className="text-red-400 font-bold">{entry.voted}</span>
              </p>
            ))}
          </div>
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
