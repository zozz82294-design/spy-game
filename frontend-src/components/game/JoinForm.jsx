import { useState } from "react";
import { Eye, LogIn, Loader2, Smartphone, Monitor } from "lucide-react";
import PageBackdrop from "@/components/game/PageBackdrop";
import { getDevicePref, setDevicePref } from "@/lib/identity";

export default function JoinForm({ roomId, onJoin, device: deviceProp }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [device, setDeviceState] = useState(deviceProp || getDevicePref());
  const isDesktop = device === "desktop";

  const chooseDevice = (d) => {
    setDeviceState(d);
    setDevicePref(d);
  };

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    setSubmitting(true);
    onJoin(n);
  };

  return (
    <PageBackdrop device={device}>
      <div className={`w-full ${isDesktop ? "max-w-6xl" : "max-w-md"} min-h-[100dvh] relative overflow-hidden flex flex-col bg-noise`} data-testid="join-screen">
        <div className="relative z-20 flex-1 flex flex-col p-6 pt-14">
          <div className="flex items-center gap-2 mb-2 fade-up">
            <div className="w-10 h-10 rounded-xl bg-red-600 border-b-4 border-red-900 flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-kufam font-black text-lg text-slate-300">SPY GAME</span>
          </div>

          <div className={`${isDesktop ? "grid grid-cols-2 gap-12 items-center flex-1" : "flex flex-col"}`}>
            <div className="mt-8 fade-up" style={{ animationDelay: "0.1s" }}>
              <h1 className={`font-kufam font-black ${isDesktop ? "text-7xl lg:text-8xl" : "text-4xl"} text-white leading-tight`}>
                انضم إلى
                <br />
                <span className="text-red-500">الغرفة</span>
              </h1>
              <p className={`mt-3 text-slate-400 ${isDesktop ? "text-base" : "text-sm"}`}>
                غرفة <span className="font-bold text-yellow-400">#{roomId}</span>
              </p>
              {isDesktop && (
                <p className="mt-6 text-slate-400 text-base leading-relaxed max-w-md">
                  اكتب اسمك للانضمام إلى أصحابك في لعبة الجاسوس. الاسم لازم يكون فريد بين اللاعبين.
                </p>
              )}
            </div>

            <div className={`${isDesktop ? "mt-0" : "mt-10"} fade-up`} style={{ animationDelay: "0.2s" }}>
              <div className="bg-[#1F2833] rounded-2xl border-2 border-slate-700/60 p-6 shadow-2xl">
                <label className="block text-sm font-bold text-slate-300 mb-2">اسمك في اللعبة</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  maxLength={20}
                  autoFocus
                  data-testid="join-name-input"
                  className="bg-slate-900/60 border-2 border-slate-700 rounded-xl h-14 text-lg font-bold text-white placeholder:text-slate-500 text-right px-4 focus:border-red-500 focus:outline-none transition-all w-full"
                  placeholder="اكتب اسمك هنا"
                />
                <button
                  onClick={submit}
                  disabled={submitting || !name.trim()}
                  data-testid="join-room-btn"
                  className="mt-6 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl h-16 px-6 text-xl font-black border-b-4 border-red-900 active:border-b-0 active:translate-y-1 btn-press flex items-center justify-center gap-2 font-kufam"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  دخول الغرفة
                </button>
              </div>
            </div>
          </div>

          {/* Device picker - visible for guests too */}
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
          </div>
        </div>
      </div>
    </PageBackdrop>
  );
}
