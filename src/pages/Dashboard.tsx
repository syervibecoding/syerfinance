import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { brl, brlCompact, sameMonth, daysInMonth, monthLabel } from "@/lib/format";
import {
  TrendingUp, ArrowUpRight, CreditCard, Users, Calendar as CalIcon,
  Receipt as ReceiptIcon, Target, Wallet,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [services, setServices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [implPayments, setImplPayments] = useState<any[]>([]);
  const [monthRef, setMonthRef] = useState(new Date());

  useEffect(() => {
    (async () => {
      const [s, c, e, co, ip] = await Promise.all([
        supabase.from("services").select("*"),
        supabase.from("maintenance_contracts").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("companies").select("*"),
        supabase.from("implementation_payments").select("*"),
      ]);
      setServices(s.data ?? []);
      setContracts(c.data ?? []);
      setExpenses(e.data ?? []);
      setCompanies(co.data ?? []);
      setImplPayments(ip.data ?? []);
    })();
  }, []);

  const metrics = useMemo(() => {
    const recurringServices = services.filter(s => Number(s.recurrence_value) > 0);
    const activeContracts = contracts.filter(c => c.status === "Ativo");
    const mrrGross = recurringServices.reduce((a, s) => a + Number(s.recurrence_value), 0)
      + activeContracts.reduce((a, c) => a + Number(c.monthly_value), 0);

    const monthExpenses = expenses.filter(x => sameMonth(x.due_date, monthRef));
    const recurringExpenses = expenses.filter(x => x.is_recurring).reduce((a, x) => a + Number(x.value), 0);
    const totalExpenses = monthExpenses.reduce((a, x) => a + Number(x.value), 0);
    const proLabore = companies.reduce((a, c) => a + Number(c.payment_value ?? 0), 0);

    const mrrNet = mrrGross - totalExpenses;
    const recurringClients = recurringServices.length + activeContracts.length;
    const ticket = recurringClients ? mrrGross / recurringClients : 0;
    const ltvAvg = ticket * 12; // assume 12 meses retenção média

    const balanceDue = services.reduce((a, s) => a + (Number(s.implementation_charged ?? 0) - Number(s.implementation_paid ?? 0)), 0);
    const dailyAverage = mrrGross / daysInMonth(monthRef);

    return { mrrGross, mrrNet, totalExpenses, recurringExpenses, ticket, ltvAvg, recurringClients, balanceDue, dailyAverage, proLabore };
  }, [services, contracts, expenses, companies, monthRef]);

  // Cash flow chart for current month — daily aggregation of expenses vs daily MRR
  const cashflowData = useMemo(() => {
    const days = daysInMonth(monthRef);
    const dailyIn = metrics.mrrGross / days;
    return Array.from({ length: days }).map((_, i) => {
      const day = i + 1;
      const dayDate = new Date(monthRef.getFullYear(), monthRef.getMonth(), day).toISOString().slice(0, 10);
      const dayOut = expenses.filter(x => x.due_date === dayDate).reduce((a, x) => a + Number(x.value), 0);
      return { day: String(day).padStart(2, "0"), entradas: Math.round(dailyIn), saidas: dayOut };
    });
  }, [monthRef, expenses, metrics.mrrGross]);

  // Receipt calendar — recorrências do mês ordenadas por dia
  const receiptCalendar = useMemo(() => {
    const list: { client: string; day: number; value: number; type: string }[] = [];
    services.filter(s => Number(s.recurrence_value) > 0).forEach(s => {
      list.push({ client: s.client, day: s.payment_day ?? 1, value: Number(s.recurrence_value), type: s.category });
    });
    contracts.filter(c => c.status === "Ativo").forEach(c => {
      list.push({ client: c.client, day: c.payment_day ?? 1, value: Number(c.monthly_value), type: "Manutenção" });
    });
    companies.forEach(c => {
      const day = parseInt(c.payment_day ?? "0", 10);
      if (day > 0) list.push({ client: c.name, day, value: Number(c.payment_value ?? 0), type: "Sociedade" });
    });
    return list.sort((a, b) => a.day - b.day);
  }, [services, contracts, companies]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Executivo"
        subtitle="Visão 360º de LTV, MRR e Fluxo de Caixa"
        monthRef={monthRef} onMonthChange={setMonthRef}
        onAdd={() => {}} addLabel="+ Novo Job"
      />

      {/* Linha 1: KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="MRR Líquido"
          value={brlCompact(metrics.mrrNet)}
          tag="Net MRR"
          tagTone="info"
          hint={`Bruto: ${brlCompact(metrics.mrrGross)}`}
          deltaLabel="Mensal"
          deltaTone="success"
        />
        <Kpi
          label="Despesas Totais"
          value={brlCompact(metrics.totalExpenses)}
          tag="Custos"
          tagTone="warning"
          hint={`Recorrente: ${brlCompact(metrics.recurringExpenses)}`}
          deltaLabel="Mensal"
          deltaTone="warning"
        />
        <Kpi
          label="Ticket Médio"
          value={brl(metrics.ticket).replace("R$", "R$").replace(/\,\d{2}$/, "")}
          tag="Ticket"
          tagTone="success"
          hint="Média por cliente ativo"
          deltaLabel="Ticket"
          deltaTone="success"
        />
        <Kpi
          label="LTV Médio"
          value={brlCompact(metrics.ltvAvg)}
          tag="Média"
          tagTone="success"
          hint="Valor médio por cliente"
          deltaLabel="Média"
          deltaTone="success"
        />
      </div>

      {/* Linha 2: Mini KPIs com ícone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IconKpi icon={CreditCard} tone="info" label="SALDO DEVEDOR (IMPL.)" value={brl(metrics.balanceDue).replace(/\,\d{2}$/, "")} hint="Total a receber de implementações" />
        <IconKpi icon={Users} tone="success" label="CLIENTES RECORRENTES" value={String(metrics.recurringClients)} hint="Com contrato ativo e recorrência" />
        <IconKpi icon={CalIcon} tone="warning" label="RECEBIMENTO MÉDIO" value={`${brlCompact(metrics.dailyAverage)}/dia`} hint="Média diária de entradas recorrentes" />
      </div>

      {/* Linha 3: Fluxo de Caixa + Calendário de Recebimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Fluxo de Recebimento</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" />ENTRADAS</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />SAÍDAS</span>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `R$ ${(v/1000).toFixed(1)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => brl(v)}
                />
                <Bar dataKey="entradas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Calendário de Recebimentos</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {receiptCalendar.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Sem recebimentos previstos.</p>}
            {receiptCalendar.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                <div className="h-12 w-12 rounded-lg bg-primary-soft flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] uppercase text-primary/70 leading-none">Dia</span>
                  <span className="text-sm font-bold text-primary leading-tight">{r.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.client}</div>
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{r.type}</div>
                </div>
                <div className="font-semibold text-sm tabular-nums">{brlCompact(r.value)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, tag, tagTone, hint, deltaLabel, deltaTone }: any) {
  const tagClass = {
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    success: "bg-success-soft text-success",
  }[tagTone as string];
  const deltaClass = {
    success: "text-success",
    warning: "text-warning",
  }[deltaTone as string];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">{label}</span>
          {tag && <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", tagClass)}>{tag}</span>}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {deltaLabel && <span className={cn("text-xs font-medium flex items-center gap-0.5", deltaClass)}><ArrowUpRight className="h-3 w-3" />{deltaLabel}</span>}
        </div>
        {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function IconKpi({ icon: Icon, tone, label, value, hint }: any) {
  const toneClass = {
    info: "bg-info-soft text-info",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  }[tone as string];
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", toneClass)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold tracking-tight mt-0.5">{value}</div>
          <div className="text-xs text-muted-foreground truncate">{hint}</div>
        </div>
      </CardContent>
    </Card>
  );
}
