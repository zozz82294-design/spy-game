import { AlertTriangle, Ban, Info } from "lucide-react";
import PageBackdrop from "@/components/game/PageBackdrop";

export default function MessageScreen({ title, subtitle, tone = "info", cta, icon, testId, device }) {
  const isDesktop = device === "desktop";
  const toneStyles = {
    warn: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    danger: { color: "text-red-500", bg: "bg-red-600/10", border: "border-red-600/30" },
    info: { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30" },
  }[tone];

  const defaultIcon =
    tone === "danger" ? <Ban className="w-12 h-12" /> :
    tone === "warn" ? <AlertTriangle className="w-12 h-12" /> :
    <Info className="w-12 h-12" />;

  return (
    <PageBackdrop device={device}>
      <div className={`w-full ${isDesktop ? "max-w-6xl" : "max-w-md"} min-h-[100dvh] relative overflow-hidden flex flex-col bg-noise`} data-testid={testId || "message-screen"}>
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className={`w-24 h-24 rounded-2xl ${toneStyles.bg} border-2 ${toneStyles.border} flex items-center justify-center ${toneStyles.color} mb-6 fade-up`}>
            {icon || defaultIcon}
          </div>
          <h2 className="font-kufam font-black text-3xl text-white mb-3 fade-up" style={{ animationDelay: "0.1s" }} data-testid="message-title">
            {title}
          </h2>
          {subtitle && (
            <p className="text-slate-400 text-base leading-relaxed max-w-xs fade-up" style={{ animationDelay: "0.15s" }}>
              {subtitle}
            </p>
          )}
          {cta && (
            <button
              onClick={cta.onClick}
              data-testid="message-cta-btn"
              className="mt-8 bg-red-600 hover:bg-red-700 text-white rounded-xl h-14 px-8 text-lg font-black border-b-4 border-red-900 active:border-b-0 active:translate-y-1 btn-press font-kufam fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              {cta.label}
            </button>
          )}
        </div>
      </div>
    </PageBackdrop>
  );
}
