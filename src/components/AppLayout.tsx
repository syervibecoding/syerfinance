import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Megaphone, Wrench, Globe, Calendar, Building2,
  KanbanSquare, Receipt, Settings, LifeBuoy, LogOut, Layers, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = { to: string; label: string; icon: any; end?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Serviços",
    items: [
      { to: "/projetos", label: "Projetos & Plataformas", icon: Layers },
      { to: "/marketing", label: "Serviços Marketing", icon: Megaphone },
      { to: "/sites", label: "Sites", icon: Globe },
      { to: "/manutencao", label: "Manutenção & Web Ops", icon: Wrench },
      { to: "/certificado-digital", label: "Certificado Digital", icon: ShieldCheck },
    ],
  },
  {
    label: "Operações",
    items: [
      { to: "/trafego", label: "Calendário de Tráfego", icon: Calendar },
      { to: "/atividades", label: "Quadro de Atividades", icon: KanbanSquare },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { to: "/portfolio", label: "Empresas & Sociedades", icon: Building2 },
      { to: "/despesas", label: "Despesas & Custos", icon: Receipt },
    ],
  },
];

const STORAGE_KEY = "sidebar:collapsed";
const GROUPS_KEY = "sidebar:groups:open";

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => { await signOut(); navigate("/auth"); };

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(GROUPS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    // default: todos abertos
    return Object.fromEntries(navGroups.map(g => [g.label, true]));
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groupsOpen));
  }, [groupsOpen]);

  // Garante que grupo da rota ativa esteja aberto
  useEffect(() => {
    const activeGroup = navGroups.find(g =>
      g.items.some(i => i.end ? location.pathname === i.to : location.pathname.startsWith(i.to))
    );
    if (activeGroup && !groupsOpen[activeGroup.label]) {
      setGroupsOpen(prev => ({ ...prev, [activeGroup.label]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (label: string) =>
    setGroupsOpen(prev => ({ ...prev, [label]: !prev[label] }));

  const initial = (user?.email ?? "S").charAt(0).toUpperCase();

  const renderItem = (item: NavItem) => {
    const link = (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) => cn(
          "flex items-center rounded-lg text-sm transition-colors",
          collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60"
        )}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.to} delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-background">
        <aside
          className={cn(
            "shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col relative transition-[width] duration-200",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <div className={cn("border-b border-sidebar-border", collapsed ? "px-2 py-5 text-center" : "px-5 py-6")}>
            {collapsed ? (
              <div className="text-lg font-bold text-primary tracking-tight">SR</div>
            ) : (
              <>
                <div className="text-xl font-bold text-primary tracking-tight">Grupo SR</div>
                <div className="text-[11px] text-muted-foreground tracking-[0.18em] uppercase mt-0.5">Personal Manager</div>
              </>
            )}
          </div>

          <button
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border border-sidebar-border bg-card shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          <nav className={cn("flex-1 py-4 overflow-y-auto", collapsed ? "px-2 space-y-3" : "px-3 space-y-3")}>
            {navGroups.map((group) => {
              const open = groupsOpen[group.label] ?? true;
              return (
                <div key={group.label} className="space-y-0.5">
                  {collapsed ? (
                    <>
                      <div className="h-px bg-sidebar-border/60 mx-2 mb-1" aria-hidden />
                      {group.items.map(renderItem)}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleGroup(group.label)}
                        className="w-full flex items-center justify-between px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80 hover:text-foreground transition-colors"
                      >
                        <span>{group.label}</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform", !open && "-rotate-90")} />
                      </button>
                      {open && group.items.map(renderItem)}
                    </>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={cn("border-t border-sidebar-border space-y-0.5", collapsed ? "p-2" : "p-3")}>
            {[
              { icon: Settings, label: "Settings", onClick: () => {} },
              { icon: LifeBuoy, label: "Support", onClick: () => {} },
              { icon: LogOut, label: "Logout", onClick: handleLogout },
            ].map((b) => {
              const btn = (
                <button
                  onClick={b.onClick}
                  className={cn(
                    "w-full flex items-center rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/60",
                    collapsed ? "justify-center h-10" : "gap-3 px-3 py-2.5"
                  )}
                >
                  <b.icon className="h-[18px] w-[18px]" />
                  {!collapsed && b.label}
                </button>
              );
              return collapsed ? (
                <Tooltip key={b.label} delayDuration={0}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right">{b.label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={b.label}>{btn}</div>
              );
            })}
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
    </TooltipProvider>
  );
}
