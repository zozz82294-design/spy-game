import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, Crown, Sparkles, Loader2, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";
import { getOrCreatePlayerId, setRoomIdentity, getDevicePref, setDevicePref } from "@/lib/identity";
import PageBackdrop from "@/components/game/PageBackdrop";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Home() {
  const nav = useNavigate();
  const [hostName, setHostName] = useState("SASUKE");
  const [loading, setLoading] = useState(false);
  const [device, setDeviceState] = useState(getDevicePref());

  const chooseDevice = (d) => {
    setDeviceState(d);
    setDevicePref(d);
  };

  const createRoom = async () => {
    const name = (hostName || "SASUKE").trim() || "SASUKE";
    setLoading(true);
    try {
      const playerId = getOrCreatePlayerId();
      const { data } = await axios.post(`${API}/rooms`, { host_name: name, player_id: playerId });
      setRoomIdentity({ roomId: data.room_id, name, isHost: true });
      toast.success("تم إنشاء الغرفة!");
      nav(`/room/${data.room_id}`);
    } catch (e) {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const isDesktop = device === "desktop";

  return (
    <PageBackdrop device={device}>
      <div
        className={`w-full ${isDesktop ? "max-w-6xl" : "max-w-md"} min-h-[100dvh] relative overflow-hidden flex flex-col bg-noise`}
        data-testid="home-screen"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-20 flex-1 flex flex-col p-6 pt-14">
          <div className="flex items-center gap-2 mb-2 fade-up">
            <div className="w-10 h-10 rounded-xl bg-red-600 border-b-4 border-red-900 flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-kufam font-black text-lg tracking-wide text-slate-300">SPY GAME</span>
          </div>

          <div className={`${isDesktop ? "grid grid-cols-2 gap-12 items-center flex-1" : "flex flex-col"}`}>
            <div className="mt-8 fade-up" style={{ animationDelay: "0.1s" }}>
              <h1 className={`font-kufam font-black ${isDesktop ? "text-7xl lg:text-8xl" : "text-5xl sm:text-6xl"} text-white leading-[1.05] tracking-tight`}>
                لعبة
                <br />
                <span className="text-red-500">الجاسوس</span>
                <span className="text-yellow-400">.</span>
              </h1>
              <p className={`mt-5 text-slate-400 ${isDesktop ? "text-lg" : "text-base"} leading-relaxed font-medium`}>
                العب مع أصحابك أونلاين. اكتشف الجاسوس قبل ما يخدعكم. لعبة سريعة، ذكية، وممتعة لمجموعات الأصدقاء.
              </p>
              {isDesktop && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-full text-xs font-bold text-slate-300">12 تصنيف</span>
                  <span className="px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-full text-xs font-bold text-slate-300">2400 كلمة</span>
                  <span className="px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-full text-xs font-bold text-slate-300">3+ لاعبين</span>
                  <span className="px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-full text-xs font-bold text-slate-300">لايف لحظي</span>
                </div>
              )}
            </div>

            <div className={`${isDesktop ? "mt-0" : "mt-10"} fade-up`} style={{ animationDelay: "0.2s" }}>
              <div className="bg-[#1F2833] rounded-2xl border-2 border-slate-700/60 p-6 shadow-2xl relative">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="font-kufam font-bold text-yellow-400 text-sm tracking-wider">أنت الهوست</span>
                </div>

                <label className="block text-sm font-bold text-slate-300 mb-2">اسم الهوست</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  maxLength={20}
                  data-testid="host-name-input"
                  className="bg-slate-900/60 border-2 border-slate-700 rounded-xl h-14 text-lg font-bold text-white placeholder:text-slate-500 text-right px-4 focus:border-red-500 focus:outline-none transition-all w-full"
                  placeholder="SASUKE"
                />
                <p className="text-xs text-slate-500 mt-2 text-right">يظهر بجانب اسمك تاج 👑 وستكون أول لاعب</p>

                <button
                  onClick={createRoom}
                  disabled={loading}
                  data-testid="create-room-btn"
                  className="mt-6 w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl h-16 px-6 text-xl font-black border-b-4 border-red-900 active:border-b-0 active:translate-y-1 btn-press flex items-center justify-center gap-2 font-kufam"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  إنشاء غرفة جديدة
                </button>
              </div>
            </div>
          </div>

          {/* Device picker */}
          <div className={`${isDesktop ? "pt-6" : "mt-auto pt-10"} fade-up`} style={{ animationDelay: "0.3s" }}>
            <p className="text-center text-xs text-slate-500 mb-3 font-bold tracking-wider">اختر طريقة العرض</p>
            <div className="bg-[#1F2833] border-2 border-slate-700/60 rounded-xl p-1.5 flex gap-1.5 max-w-xs mx-auto">
              <button
                onClick={() => chooseDevice("mobile")}
                data-testid="device-mobile-btn"
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                  device === "mobile" ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                موبايل
              </button>
              <button
                onClick={() => chooseDevice("desktop")}
                data-testid="device-desktop-btn"
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all ${
                  device === "desktop" ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Monitor className="w-4 h-4" />
                كمبيوتر
              </button>
            </div>
            <p className="text-center text-slate-500 text-xs mt-4">
              بعد إنشاء الغرفة، انسخ الرابط وأرسله لأصحابك
            </p>
          </div>
        </div>
      </div>
    </PageBackdrop>
  );
}
