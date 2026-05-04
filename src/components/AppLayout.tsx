import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Megaphone, Wrench, Globe, Calendar, Building2,
  KanbanSquare, Receipt, Settings, LifeBuoy, LogOut, Layers, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/projetos", label: "Projetos & Plataformas", icon: Layers },
  { to: "/marketing", label: "Serviços Marketing", icon: Megaphone },
  { to: "/manutencao", label: "Manutenção & Web Ops", icon: Wrench },
  { to: "/sites", label: "Sites", icon: Globe },
  { to: "/certificado-digital", label: "Certificado Digital", icon: ShieldCheck },
  { to: "/trafego", label: "Calendário de Tráfego", icon: Calendar },
  { to: "/portfolio", label: "Empresas & Sociedades", icon: Building2 },
  { to: "/atividades", label: "Quadro de Atividades", icon: KanbanSquare },
  { to: "/despesas", label: "Despesas & Custos", icon: Receipt },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await signOut(); navigate("/auth"); };

  const initial = (user?.email ?? "S").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="text-xl font-bold text-primary tracking-tight">Grupo SR</div>
          <div className="text-[11px] text-muted-foreground tracking-[0.18em] uppercase mt-0.5">Personal Manager</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/60">
            <Settings className="h-[18px] w-[18px]" />Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/60">
            <LifeBuoy className="h-[18px] w-[18px]" />Support
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/60">
            <LogOut className="h-[18px] w-[18px]" />Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-6 lg:px-8 border-b bg-card flex items-center justify-between gap-4">
          <div className="flex-1 max-w-xl">
            <input
              placeholder="Buscar plataformas ou métricas..."
              className="w-full h-10 px-4 rounded-lg bg-secondary text-sm placeholder:text-muted-foreground border-none focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold leading-tight">{user?.email?.split("@")[0]}</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.15em] uppercase">Managing Director</div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning text-warning-foreground flex items-center justify-center font-bold">
              {initial}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="px-6 py-6 lg:px-10 lg:py-8 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
