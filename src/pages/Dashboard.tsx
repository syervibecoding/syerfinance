import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { Briefcase, Wrench, Receipt, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Dashboard() {
  const [services, setServices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [s, c, e] = await Promise.all([
        supabase.from("services").select("*").order("created_at", { ascending: false }),
        supabase.from("maintenance_contracts").select("*"),
        supabase.from("expenses").select("*"),
      ]);
      setServices(s.data ?? []);
      setContracts(c.data ?? []);
      setExpenses(e.data ?? []);
    })();
  }, []);

  const totalImplementation = services.reduce((a, s) => a + Number(s.implementation_charged ?? 0), 0);
  const totalRecurrence = services.reduce((a, s) => a + Number(s.recurrence_value ?? 0), 0)
    + contracts.filter(c => c.status === "Ativo").reduce((a, c) => a + Number(c.monthly_value ?? 0), 0);
  const pendingExpenses = expenses.filter(e => e.status === "Pendente").reduce((a, e) => a + Number(e.value ?? 0), 0);
  const activeJobs = services.filter(s => s.status !== "Entregue").length;

  const byCategory = ["Marketing", "Plataformas", "Web Ops", "Sites"].map(cat => ({
    cat,
    valor: services.filter(s => s.category === cat).reduce((a, s) => a + Number(s.value ?? 0), 0),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada do Grupo SR</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Receita recorrente" value={brl(totalRecurrence)} icon={TrendingUp} hint="MRR estimado" />
        <Kpi title="Implementações" value={brl(totalImplementation)} icon={Briefcase} hint="Total cobrado" />
        <Kpi title="Manutenções ativas" value={String(contracts.filter(c => c.status === "Ativo").length)} icon={Wrench} hint={`${contracts.length} contratos`} />
        <Kpi title="Despesas pendentes" value={brl(pendingExpenses)} icon={Receipt} hint="A pagar" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Receita por categoria</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="cat" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => brl(v)}
                />
                <Bar dataKey="valor" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Serviços recentes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {services.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.client}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.service_name}</div>
                </div>
                <Badge variant="secondary" className="shrink-0">{s.status}</Badge>
              </div>
            ))}
            {services.length === 0 && <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>}
            <div className="pt-2 border-t text-xs text-muted-foreground">Trabalhos ativos: <strong className="text-foreground">{activeJobs}</strong></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ title, value, icon: Icon, hint }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{title}</span>
          <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center"><Icon className="h-4 w-4 text-muted-foreground" /></div>
        </div>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{hint}</div>
      </CardContent>
    </Card>
  );
}
