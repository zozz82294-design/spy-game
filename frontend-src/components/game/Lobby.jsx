import { useState } from "react";
import { Crown, Copy, LogOut, Play, Check, Users } from "lucide-react";
import { toast } from "sonner";

export default function Lobby({ state, me, isHost, send, onLeave, isDesktop }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/room/${state.room_id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const startGame = () => { if (state.can_start) send({ type: "start_game" }); };

  return (
    <div className="flex flex-col flex-1 p-5 pt-6" data-testid="lobby-screen">
      <div className="flex items-center justify-center mb-6 pt-2">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.2em] text-slate-500 font-bold">ROOM</p>
          <p className="font-kufam font-black text-xl text-white tracking-wider" data-testid="room-id-display">#{state.room_id}</p>
        </div>
      </div>

      <div className={`${isDesktop ? "grid grid-cols-2 gap-5" : "flex flex-col"} flex-1`}>
        <div className="flex flex-col">
          <div className="bg-[#1F2833] rounded-2xl border-2 border-slate-700/60 p-4 mb-5 fade-up">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 tracking-wider">ادعُ أصحابك</span>
            </div>
            <button
              onClick={copy}
              data-testid="copy-link-btn"
              className="w-full bg-slate-900/60 hover:bg-slate-900 border-2 border-slate-700 rounded-xl h-14 px-4 flex items-center justify-between gap-2 transition-colors"
            >
              <span className="text-sm text-slate-400 truncate flex-1 text-right" dir="ltr">{link}</span>
              {copied ? <Check className="w-5 h-5 text-emerald-400 shrink-0" /> : <Copy className="w-5 h-5 text-slate-400 shrink-0" />}
            </button>
          </div>

          {!isDesktop && state.players.length < 3 && (
            <p className="text-center text-sm text-slate-500 mt-2 fade-up" data-testid="need-more-players">
              تحتاج {3 - state.players.length} لاعب على الأقل لبدء اللعبة
            </p>
          )}
          {!isDesktop && state.players.length >= 3 && !isHost && (
            <p className="text-center text-sm text-yellow-400 mt-2 fade-up" data-testid="waiting-host-msg">
              في انتظار الهوست لبدء اللعبة...
            </p>
          )}
        </div>

        <div className="flex-1 fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-kufam font-black text-white text-lg">اللاعبون</h3>
            <span className="text-sm font-bold text-slate-400" data-testid="player-count">{state.players.length} لاعب</span>
          </div>
          <div className="space-y-2.5">
            {state.players.map((p, idx) => (
              <PlayerRow key={p.id} player={p} index={idx} isMe={p.id === me?.id} />
            ))}
          </div>
          {isDesktop && state.players.length < 3 && (
            <p className="text-center text-sm text-slate-500 mt-6 fade-up" data-testid="need-more-players">
              تحتاج {3 - state.players.length} لاعب على الأقل لبدء اللعبة
            </p>
          )}
          {isDesktop && state.players.length >= 3 && !isHost && (
            <p className="text-center text-sm text-yellow-400 mt-6 fade-up" data-testid="waiting-host-msg">
              في انتظار الهوست لبدء اللعبة...
            </p>
          )}
        </div>
      </div>

      <div className="pt-6 space-y-3 sticky bottom-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10] to-transparent pb-2 -mx-5 px-5">
        {isHost && (
          <button
            onClick={startGame}
            disabled={!state.can_start}
            data-testid="start-game-btn"
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 text-white rounded-xl h-16 px-6 text-xl font-black border-b-4 border-red-900 disabled:border-b-2 active:border-b-0 active:translate-y-1 btn-press flex items-center justify-center gap-2 font-kufam"
          >
            <Play className="w-5 h-5" />
            بدء اللعبة
          </button>
        )}
        <button
          onClick={onLeave}
          data-testid="leave-btn"
          className="w-full bg-transparent border-2 border-red-900/60 text-red-400 hover:bg-red-950/30 rounded-xl h-12 px-4 font-bold transition-colors flex items-center justify-center gap-2 font-kufam"
        >
          <LogOut className="w-4 h-4" />
          مغادرة
        </button>
      </div>
    </div>
  );
}

function PlayerRow({ player, index, isMe }) {
  const isHost = player.is_host;
  return (
    <div
      data-testid={`player-row-${player.id}`}
      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all slide-in ${
        isHost ? "bg-yellow-500/10 border-yellow-500/40" : "bg-slate-800/40 border-slate-700/60"
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-kufam font-black text-sm ${
          isHost ? "bg-yellow-500 text-slate-900" : "bg-slate-700 text-slate-200"
        }`}>
          {index + 1}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-lg" data-testid={`player-name-${player.id}`}>{player.name}</span>
          {isHost && <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
          {isMe && <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">أنت</span>}
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${player.connected ? "bg-emerald-400" : "bg-slate-600"}`} />
    </div>
  );
}
