import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Crown, UserX, RotateCcw } from "lucide-react";

export default function SettingsDrawer({ open, onOpenChange, state, send }) {
  const kick = (pid) => {
    if (window.confirm("متأكد من طرد هذا اللاعب؟")) {
      send({ type: "kick", target_id: pid });
    }
  };
  const restart = () => {
    if (window.confirm("متأكد من إعادة اللعبة؟ سيرجع الجميع للوبي.")) {
      send({ type: "restart_game" });
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#1F2833] border-t-2 border-slate-700 max-w-md mx-auto" dir="rtl" data-testid="settings-drawer">
        <DrawerHeader className="text-right">
          <DrawerTitle className="font-kufam font-black text-2xl text-white">الإعدادات</DrawerTitle>
          <DrawerDescription className="text-slate-400">إدارة الغرفة واللاعبين</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4 pb-8">
          <button
            onClick={restart}
            data-testid="restart-game-btn"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl h-14 px-4 font-bold border-2 border-slate-700 flex items-center gap-3 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-yellow-400" />
            <span className="font-kufam">إعادة اللعبة</span>
          </button>

          <div>
            <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-3 px-1">اللاعبون</h4>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {state.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{p.name}</span>
                    {p.is_host && <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                  </div>
                  {!p.is_host && (
                    <button
                      onClick={() => kick(p.id)}
                      data-testid={`kick-btn-${p.id}`}
                      className="bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 text-red-400 rounded-lg h-9 px-3 text-sm font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      طرد
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
