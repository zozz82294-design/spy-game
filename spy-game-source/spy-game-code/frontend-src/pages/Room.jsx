import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, AlertTriangle, Settings } from "lucide-react";
import { toast } from "sonner";
import { getOrCreatePlayerId, getRoomIdentity, setRoomIdentity, clearRoomIdentity, getDevicePref } from "@/lib/identity";
import { useGameSocket } from "@/hooks/useGameSocket";
import Lobby from "@/components/game/Lobby";
import CategorySelect from "@/components/game/CategorySelect";
import RoleReveal from "@/components/game/RoleReveal";
import Voting from "@/components/game/Voting";
import SpyCaught from "@/components/game/SpyCaught";
import SpyGuess from "@/components/game/SpyGuess";
import Result from "@/components/game/Result";
import JoinForm from "@/components/game/JoinForm";
import MessageScreen from "@/components/game/MessageScreen";
import SettingsDrawer from "@/components/game/SettingsDrawer";
import PageBackdrop from "@/components/game/PageBackdrop";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Room() {
  const { roomId } = useParams();
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);
  const [roomStatus, setRoomStatus] = useState(null);
  const [name, setName] = useState("");
  const [joinReady, setJoinReady] = useState(false);
  const [forceMessage, setForceMessage] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const device = getDevicePref();
  const isDesktop = device === "desktop";

  const playerId = getOrCreatePlayerId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API}/rooms/${roomId}`);
        if (cancelled) return;
        setRoomStatus({ valid: true, started: data.started });

        const ident = getRoomIdentity();
        if (ident && ident.roomId === roomId && ident.name) {
          setName(ident.name);
          setJoinReady(true);
        } else {
          if (data.started) setForceMessage({ type: "game_started" });
        }
      } catch (e) {
        if (cancelled) return;
        setRoomStatus({ valid: false });
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roomId]);

  const { state, send, closeReason } = useGameSocket({
    roomId: joinReady ? roomId : null,
    playerId,
    name,
    onEvent: (msg) => {
      if (msg.type === "name_taken") toast.error("الاسم مستخدم بالفعل");
    },
  });

  const exitToHome = () => {
    clearRoomIdentity();
    nav("/");
  };

  if (checking) {
    return (
      <FullScreen><Loader2 className="w-10 h-10 text-red-500 animate-spin" /></FullScreen>
    );
  }

  if (!roomStatus?.valid) {
    return (
      <MessageScreen title="انتهت صلاحية الرابط" subtitle="هذه الغرفة لم تعد متاحة. اطلب من الهوست إرسال رابط جديد." tone="warn"
        cta={{ label: "العودة للرئيسية", onClick: exitToHome }} testId="expired-screen" device={device}
        icon={<AlertTriangle className="w-12 h-12 text-yellow-500" />} />
    );
  }
  if (forceMessage?.type === "game_started" || closeReason === "game_started") {
    return <MessageScreen title="اللعبة قد بدأت بالفعل" subtitle="لا يمكن الانضمام بعد بدء اللعبة. انتظر الجولة القادمة." tone="warn"
      cta={{ label: "العودة للرئيسية", onClick: exitToHome }} testId="game-started-screen" device={device} />;
  }
  if (closeReason === "kicked") {
    return <MessageScreen title="تم طردك من اللعبة" subtitle="الهوست قام بطردك من الغرفة." tone="danger"
      cta={{ label: "العودة للرئيسية", onClick: exitToHome }} testId="kicked-screen" device={device} />;
  }
  if (closeReason === "expired") {
    return <MessageScreen title="انتهت صلاحية الرابط" subtitle="تم إنشاء غرفة جديدة، هذه الغرفة لم تعد فعّالة." tone="warn"
      cta={{ label: "العودة للرئيسية", onClick: exitToHome }} testId="expired-screen" device={device} />;
  }
  if (closeReason === "host_left") {
    return <MessageScreen title="غادر الهوست" subtitle="انتهت اللعبة لأن صاحب الغرفة غادر." tone="warn"
      cta={{ label: "العودة للرئيسية", onClick: exitToHome }} testId="host-left-screen" device={device} />;
  }

  if (!joinReady) {
    return (
      <JoinForm roomId={roomId} device={device} onJoin={(n) => {
        setName(n);
        setRoomIdentity({ roomId, name: n, isHost: false });
        setJoinReady(true);
      }} />
    );
  }

  if (!state) {
    return (
      <FullScreen>
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        <p className="mt-4 text-slate-400">جاري الاتصال...</p>
      </FullScreen>
    );
  }

  const me = state.players.find((p) => p.id === playerId);
  const isHost = me?.is_host;

  const handleLeave = () => {
    send({ type: "leave" });
    clearRoomIdentity();
    toast("لقد غادرت اللعبة");
    setTimeout(() => nav("/"), 300);
  };

  const screen = state.state;
  const screenProps = { state, me, isHost, send, onLeave: handleLeave, playerId, device, isDesktop };

  return (
    <PageBackdrop device={device}>
      <div className={`w-full ${isDesktop ? "max-w-6xl" : "max-w-md"} min-h-[100dvh] relative overflow-hidden flex flex-col bg-noise`}>
        {/* Persistent settings button for host - visible across all screens */}
        {isHost && (
          <button
            onClick={() => setSettingsOpen(true)}
            data-testid="settings-btn-fab"
            className="absolute top-4 left-4 z-30 w-11 h-11 rounded-xl bg-slate-800/95 backdrop-blur border-2 border-slate-700 flex items-center justify-center hover:bg-slate-700 hover:border-red-500 transition-all shadow-lg"
            aria-label="الإعدادات"
          >
            <Settings className="w-5 h-5 text-yellow-400" />
          </button>
        )}

        <div className="relative z-20 flex-1 flex flex-col screen-fade" key={screen}>
          {screen === "lobby" && <Lobby {...screenProps} />}
          {screen === "category" && <CategorySelect {...screenProps} />}
          {screen === "reveal" && <RoleReveal {...screenProps} />}
          {screen === "voting" && <Voting {...screenProps} />}
          {screen === "spy_caught" && <SpyCaught {...screenProps} />}
          {screen === "spy_guess" && <SpyGuess {...screenProps} />}
          {screen === "finished" && <Result {...screenProps} />}
        </div>

        {isHost && (
          <SettingsDrawer
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            state={state}
            send={send}
          />
        )}
      </div>
    </PageBackdrop>
  );
}

function FullScreen({ children }) {
  return (
    <div className="min-h-[100dvh] bg-[#0B0C10] flex flex-col items-center justify-center" dir="rtl">
      {children}
    </div>
  );
}
