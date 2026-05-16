import { LayoutDashboard, History, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "dashboard" | "historico" | "metas" | "investimentos";

const TABS: { key: TabKey; label: string; Icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "historico", label: "Histórico", Icon: History },
  { key: "metas", label: "Metas", Icon: Target },
  { key: "investimentos", label: "Carteira", Icon: TrendingUp },
];

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_8px_var(--color-primary)]")} />
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
