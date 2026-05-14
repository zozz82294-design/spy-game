// Background wrapper that renders a rich ambient backdrop on desktop
// and a clean dark background on mobile.
export default function PageBackdrop({ device, children }) {
  const isDesktop = device === "desktop";
  if (!isDesktop) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0C10] bg-scan flex justify-center" dir="rtl">
        {children}
      </div>
    );
  }
  return (
    <div className="min-h-[100dvh] desktop-bg bg-scan flex justify-center relative overflow-hidden" dir="rtl">
      {/* Floating orbs */}
      <div className="orb-1 absolute -top-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
      <div className="orb-2 absolute -bottom-40 -left-20 w-[32rem] h-[32rem] rounded-full bg-yellow-500/8 blur-3xl pointer-events-none" />
      <div className="orb-1 absolute top-1/3 left-1/4 w-[20rem] h-[20rem] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      {/* Side watermarks */}
      <div className="desktop-watermark" style={{ top: "8%", right: "-3rem", transform: "rotate(-8deg)" }}>SPY</div>
      <div className="desktop-watermark" style={{ bottom: "5%", left: "-4rem", transform: "rotate(6deg)" }}>الجاسوس</div>

      {/* Content */}
      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>

      {/* Vignette on top */}
      <div className="desktop-vignette" />
    </div>
  );
}
