import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { FinanceProvider } from "@/hooks/use-finance";
import { BottomNav, type TabKey } from "@/components/BottomNav";
import { Dashboard } from "@/components/tabs/Dashboard";
import { Historico } from "@/components/tabs/Historico";
import { Metas } from "@/components/tabs/Metas";
import { Investimentos } from "@/components/tabs/Investimentos";
import { Loader2 } from "lucide-react";
import { PinGate } from "@/components/PinGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bolso Sem Neura — Controle financeiro inteligente" },
      { name: "description", content: "Controle de gastos e investimentos com IA. Modo escuro premium, mobile-first." },
      { property: "og:title", content: "Bolso Sem Neura" },
      { property: "og:description", content: "Seu dinheiro e investimentos controlados por IA." },
    ],
  }),
  component: AppShell,
});

function AppShell() {
  const { user, loading, hasPin, pinUnlocked } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("dashboard");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (hasPin && !pinUnlocked) return <PinGate />;

  return (
    <FinanceProvider>
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-md px-5 pb-28">
          {tab === "dashboard" && <Dashboard />}
          {tab === "historico" && <Historico />}
          {tab === "metas" && <Metas />}
          {tab === "investimentos" && <Investimentos />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </FinanceProvider>
  );
}
