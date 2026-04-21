import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Briefcase, Wrench, Receipt, Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/servicos", label: "Serviços", icon: Briefcase },
  { to: "/manutencao", label: "Manutenção", icon: Wrench },
  { to: "/despesas", label: "Despesas", icon: Receipt },
  { to: "/portfolio", label: "Portfólio", icon: Building2 },
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => { await signOut(); navigate("/auth"); };

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">SR</div>
          <div>
            <div className="text-sm font-semibold leading-tight">Grupo SR</div>
            <div className="text-xs text-muted-foreground">Executive panel</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <item.icon className="h-4 w-4" />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-2 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
