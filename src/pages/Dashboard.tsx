import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { brl, brlCompact, sameMonth, daysInMonth, monthLabel } from "@/lib/format";
import {
  TrendingUp, ArrowUpRight, CreditCard, Users, Calendar as CalIcon,
  Receipt as ReceiptIcon, Target, Wallet, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, ComposedChart } from "recharts";
import { cn } from "@/lib/utils";
import { activeValue, isPeriodDue, monthlyEquivalent, isContractActive } from "@/lib/pricing";

// Parse 'YYYY-MM-DD' como data LOCAL (evita shift de fuso que joga dia 01 para o mês anterior)
function parseLocalDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const iso = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export default function Dashboard() {
  const [services, setServices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [implPayments, setImplPayments] = useState<any[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<any[]>([]);
  const [monthRef, setMonthRef] = useState(new Date());

  useEffect(() => {
    (async () => {
      const [s, c, e, co, ip, pr] = await Promise.all([
        supabase.from("services").select("*"),
        supabase.from("maintenance_contracts").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("companies").select("*"),
        supabase.from("implementation_payments").select("*"),
        supabase.from("payment_records").select("*"),
      ]);
      setServices(s.data ?? []);
      setContracts(c.data ?? []);
      setExpenses(e.data ?? []);
      setCompanies(co.data ?? []);
      setImplPayments(ip.data ?? []);
      setPaymentRecords(pr.data ?? []);
    })();
  }, []);

  const metrics = useMemo(() => {
    const recurringServices = services.filter(s => s.category !== "Certificado Digital" && Number(s.recurrence_value) > 0);
    const activeContracts = contracts.filter(c => c.status === "Ativo");
    const mrrGross = recurringServices.reduce((a, s) => a + monthlyEquivalent(s.recurrence_value, s.recurrence_period), 0)
      + activeContracts.reduce((a, c) => a + Number(c.monthly_value), 0);

    const monthExpenses = expenses.filter(x => sameMonth(x.due_date, monthRef));
    const recurringExpenses = expenses.filter(x => x.is_recurring).reduce((a, x) => a + Number(x.value), 0);
    const totalExpenses = monthExpenses.reduce((a, x) => a + Number(x.value), 0);
    const proLabore = companies.reduce((a, c) => a + Number(c.payment_value ?? 0), 0);

    const mrrNet = mrrGross - totalExpenses;
    const recurringClients = recurringServices.length + activeContracts.length;
    const ticket = recurringClients ? mrrGross / recurringClients : 0;
    const ltvAvg = ticket * 12; // assume 12 meses retenção média

    const totalPaidByService: Record<string, number> = {};
    implPayments.forEach(p => { totalPaidByService[p.service_id] = (totalPaidByService[p.service_id] ?? 0) + Number(p.value); });
    const balanceDue = services.reduce((a, s) => a + (Number(s.implementation_charged ?? 0) - (totalPaidByService[s.id] ?? 0)), 0);
    const dailyAverage = mrrGross / daysInMonth(monthRef);

    return { mrrGross, mrrNet, totalExpenses, recurringExpenses, ticket, ltvAvg, recurringClients, balanceDue, dailyAverage, proLabore };
  }, [services, contracts, expenses, companies, implPayments, monthRef]);

  // Entradas históricas simuladas (não cadastradas na plataforma) — chave: "YYYY-M" (mês 0-indexado)
  const HISTORICAL_ENTRIES: Record<string, number> = {
    "2026-0": 2040,      // Janeiro/2026
    "2026-1": 2350.37,   // Fevereiro/2026
    "2026-2": 6120,      // Março/2026
  };

  // Fluxo mensal — últimos 6 meses + atual + próximos 5 (12 meses centrados)
  const cashflowData = useMemo(() => {
    const months: { key: string; label: string; year: number; month: number }[] = [];
    for (let i = -6; i <= 5; i++) {
      const d = new Date(monthRef.getFullYear(), monthRef.getMonth() + i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") + "/" + String(d.getFullYear()).slice(-2),
        year: d.getFullYear(), month: d.getMonth(),
      });
    }

    // Recorrências ativas (serviços + contratos + sociedades) — só contam a partir do início da recorrência
    const recurringEntries = (year: number, month: number) => {
      // Override histórico: se houver valor fixo para o mês, ignora cálculos e usa o valor fixo
      const override = HISTORICAL_ENTRIES[`${year}-${month}`];
      if (override !== undefined) return override;

      const refMonth = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      let total = 0;
      services.filter(s => s.category !== "Certificado Digital" && Number(s.recurrence_value) > 0).forEach(s => {
        const start = s.recurrence_start_date ? new Date(s.recurrence_start_date) : null;
        if (start && start > monthEnd) return;
        if (!isPeriodDue(s.recurrence_period, s.recurrence_start_date, refMonth)) return;
        total += activeValue(s.recurrence_value, s.next_recurrence_value, s.next_value_start, refMonth);
      });
      contracts.filter(c => c.status === "Ativo").forEach(c => {
        const start = c.recurrence_start_date ? new Date(c.recurrence_start_date) : null;
        if (!start || start <= monthEnd) total += activeValue(c.monthly_value, c.next_monthly_value, c.next_value_start, refMonth);
      });
      // Sociedades — entram em todo mês também
      companies.forEach(co => {
        total += activeValue(co.payment_value, co.next_payment_value, co.next_value_start, refMonth);
      });
      // Histórico/registros pontuais com value e sem recorrência: contam só no mês de início
      services.filter(s => (s.category === "Certificado Digital" || !Number(s.recurrence_value)) && Number(s.value) > 0 && s.recurrence_start_date).forEach(s => {
        const d = parseLocalDate(s.recurrence_start_date);
        if (d && d.getFullYear() === year && d.getMonth() === month) total += Number(s.value);
      });
      // Pagamentos de implementação recebidos no mês
      implPayments.forEach(p => {
        const d = new Date(p.paid_date);
        if (d.getFullYear() === year && d.getMonth() === month) total += Number(p.value);
      });
      return total;
    };

    // Realizado = soma do received_value dos payment_records do mês + impl pagos no mês
    const realizadoEntries = (year: number, month: number) => {
      const override = HISTORICAL_ENTRIES[`${year}-${month}`];
      if (override !== undefined) return override;
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      let total = paymentRecords
        .filter(r => r.reference_month === monthStr)
        .reduce((a, r) => a + Number(r.received_value || 0), 0);
      implPayments.forEach(p => {
        const d = new Date(p.paid_date);
        if (d.getFullYear() === year && d.getMonth() === month) total += Number(p.value);
      });
      return total;
    };

    return months.map(m => {
      const entradasTotal = recurringEntries(m.year, m.month);
      const realizado = realizadoEntries(m.year, m.month);
      const hasOverride = HISTORICAL_ENTRIES[`${m.year}-${m.month}`] !== undefined;
      const certificados = hasOverride ? 0 : services
        .filter(s => s.category === "Certificado Digital" && s.recurrence_start_date)
        .filter(s => {
          const d = parseLocalDate(s.recurrence_start_date);
          return d && d.getFullYear() === m.year && d.getMonth() === m.month;
        })
        .reduce((a, s) => a + Number(s.value || 0), 0);
      const entradasBase = entradasTotal - certificados;
      const saidas = expenses
        .filter(x => { const d = new Date(x.due_date); return d.getFullYear() === m.year && d.getMonth() === m.month; })
        .reduce((a, x) => a + Number(x.value), 0);
      return {
        month: m.label,
        entradasBase: Math.round(entradasBase * 100) / 100,
        certificados: Math.round(certificados * 100) / 100,
        entradas: Math.round(entradasTotal * 100) / 100,
        realizado: Math.round(realizado * 100) / 100,
        saidas: Math.round(saidas * 100) / 100,
      };
    });
  }, [monthRef, expenses, services, contracts, companies, implPayments, paymentRecords]);

  // Métricas e histórico de Certificado Digital
  const certData = useMemo(() => {
    const all = services
      .filter(s => s.category === "Certificado Digital" && s.recurrence_start_date)
      .map(s => ({
        date: parseLocalDate(s.recurrence_start_date) as Date,
        value: Number(s.value || 0),
        qty: Number(s.recurrence_value || 0),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const monthValue = all
      .filter(c => c.date.getFullYear() === monthRef.getFullYear() && c.date.getMonth() === monthRef.getMonth())
      .reduce((a, c) => a + c.value, 0);
    const monthQty = all
      .filter(c => c.date.getFullYear() === monthRef.getFullYear() && c.date.getMonth() === monthRef.getMonth())
      .reduce((a, c) => a + c.qty, 0);

    // próximo certificado se mês atual não tem
    const nextUpcoming = monthValue === 0
      ? all
          .filter(c => c.date >= new Date(monthRef.getFullYear(), monthRef.getMonth(), 1))
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0]
      : null;

    return { all, monthValue, monthQty, nextUpcoming };
  }, [services, monthRef]);

  // Totais do mês selecionado (previsto, recebido, em aberto, saídas, saldo)
  const monthTotals = useMemo(() => {
    const label = monthRef.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") + "/" + String(monthRef.getFullYear()).slice(-2);
    const cur = cashflowData.find(c => c.month === label);
    const previsto = cur?.entradas ?? 0;
    const recebido = cur?.realizado ?? 0;
    const aberto = Math.max(previsto - recebido, 0);
    const saidas = cur?.saidas ?? 0;
    return { previsto, recebido, aberto, saidas, saldo: recebido - saidas };
  }, [cashflowData, monthRef]);

  // Receipt calendar — recorrências do mês ordenadas por dia
  const receiptCalendar = useMemo(() => {
    const list: { client: string; day: number; value: number; type: string }[] = [];
    services.filter(s => s.category !== "Certificado Digital" && Number(s.recurrence_value) > 0).forEach(s => {
      if (!isPeriodDue(s.recurrence_period, s.recurrence_start_date, monthRef)) return;
      const val = Number(s.recurrence_value);
      const suffix = s.recurrence_period === "Anual" ? " (anual)" : "";
      if (s.split_payment && s.payment_day_2) {
        list.push({ client: `${s.client} (1ª parcela)${suffix}`, day: s.payment_day ?? 1, value: val / 2, type: s.category });
        list.push({ client: `${s.client} (2ª parcela)${suffix}`, day: s.payment_day_2, value: val / 2, type: s.category });
      } else {
        list.push({ client: `${s.client}${suffix}`, day: s.payment_day ?? 1, value: val, type: s.category });
      }
    });
    contracts.filter(c => c.status === "Ativo").forEach(c => {
      list.push({ client: c.client, day: c.payment_day ?? 1, value: Number(c.monthly_value), type: "Manutenção" });
    });
    companies.forEach(c => {
      const day = parseInt(c.payment_day ?? "0", 10);
      if (day > 0) list.push({ client: c.name, day, value: Number(c.payment_value ?? 0), type: "Sociedade" });
    });
    // Certificado Digital — registros pontuais do mês selecionado
    services
      .filter(s => s.category === "Certificado Digital" && s.recurrence_start_date && Number(s.value) > 0)
      .forEach(s => {
        const d = parseLocalDate(s.recurrence_start_date);
        if (d && d.getFullYear() === monthRef.getFullYear() && d.getMonth() === monthRef.getMonth()) {
          const qty = Number(s.recurrence_value ?? 0);
          list.push({
            client: `${s.client}${qty ? ` (${qty} cert.)` : ""}`,
            day: d.getDate() || 1,
            value: Number(s.value),
            type: "Certificado Digital",
          });
        }
      });
    return list.sort((a, b) => a.day - b.day);
  }, [services, contracts, companies, monthRef]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Executivo"
        subtitle="Visão 360º de LTV, MRR e Fluxo de Caixa"
        monthRef={monthRef} onMonthChange={setMonthRef}
      />

      {/* Banner: cobranças anuais do mês */}
      {(() => {
        const anuais = services.filter(s =>
          s.recurrence_period === "Anual" &&
          Number(s.recurrence_value) > 0 &&
          isPeriodDue("Anual", s.recurrence_start_date, monthRef)
        );
        if (!anuais.length) return null;
        const total = anuais.reduce((a, s) => a + Number(s.recurrence_value), 0);
        return (
          <Card className="border-warning/40 bg-warning-soft">
            <CardContent className="py-4 flex items-start gap-3">
              <div className="rounded-md bg-warning/20 p-2 text-warning"><ReceiptIcon className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  Cobrança anual neste mês — {brl(total)}
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {anuais.map(s => (
                    <div key={s.id}>
                      <span className="font-medium text-foreground">{s.client}</span> · {s.service_name} — {brl(Number(s.recurrence_value))}
                      {s.payment_day ? ` · vence dia ${s.payment_day}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}


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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IconKpi icon={CreditCard} tone="info" label="SALDO DEVEDOR (IMPL.)" value={brl(metrics.balanceDue).replace(/\,\d{2}$/, "")} hint="Total a receber de implementações" />
        <IconKpi icon={Users} tone="success" label="CLIENTES RECORRENTES" value={String(metrics.recurringClients)} hint="Com contrato ativo e recorrência" />
        <IconKpi icon={CalIcon} tone="warning" label="RECEBIMENTO MÉDIO" value={`${brlCompact(metrics.dailyAverage)}/dia`} hint="Média diária de entradas recorrentes" />
        <IconKpi
          icon={ShieldCheck}
          tone="info"
          label="CERTIFICADOS DIGITAIS"
          value={brl(certData.monthValue).replace(/\,\d{2}$/, "")}
          hint={certData.monthQty > 0
            ? `CM Contábil — ${certData.monthQty} certificado${certData.monthQty > 1 ? "s" : ""} no mês`
            : (certData.nextUpcoming
                ? `Próximo: ${certData.nextUpcoming.date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })} — ${brl(certData.nextUpcoming.value)}`
                : "Nenhum registro no mês")}
        />
      </div>

      {/* Histórico de meses com Certificado Digital — chips clicáveis */}
      {certData.all.length > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Histórico Cert. Digital
            </span>
            <div className="flex flex-wrap gap-2">
              {certData.all.slice(0, 12).map((c, i) => {
                const isCurrent = c.date.getFullYear() === monthRef.getFullYear() && c.date.getMonth() === monthRef.getMonth();
                return (
                  <Button
                    key={i}
                    size="sm"
                    variant={isCurrent ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => setMonthRef(new Date(c.date.getFullYear(), c.date.getMonth(), 1))}
                  >
                    {c.date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })} · {brl(c.value).replace(/\,\d{2}$/, "")}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linha 3: Fluxo de Caixa + Calendário de Recebimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg">Fluxo Mensal de Entradas e Saídas</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Comparativo mês a mês (12 meses)</p>
            </div>
            <div className="flex items-center gap-3 text-xs flex-wrap justify-end">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent/40 border border-accent" />PREVISTO</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" />REALIZADO</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />SAÍDAS</span>
            </div>
          </CardHeader>
          <div className="px-6 pb-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            <TotalPill label="Previsto" value={monthTotals.previsto} tone="info" />
            <TotalPill label="Recebido" value={monthTotals.recebido} tone="success" />
            <TotalPill label="Em aberto" value={monthTotals.aberto} tone={monthTotals.aberto > 0 ? "warning" : "success"} />
            <TotalPill label="Saldo" value={monthTotals.saldo} tone={monthTotals.saldo >= 0 ? "success" : "danger"} />
          </div>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />

                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `R$ ${(v/1000).toFixed(1)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => {
                    const labels: Record<string, string> = {
                      entradas: "Previsto",
                      realizado: "Realizado",
                      saidas: "Saídas",
                    };
                    return [brl(v), labels[name] ?? name];
                  }}
                />
                <Bar dataKey="entradas" fill="hsl(var(--accent) / 0.35)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-lg">Calendário de Recebimentos</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {receiptCalendar.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Sem recebimentos previstos.</p>}
            {receiptCalendar.map((r, i) => {
              const isCert = r.type === "Certificado Digital";
              return (
                <div key={i} className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50", isCert && "bg-info-soft/40")}>
                  <div className={cn("h-12 w-12 rounded-lg flex flex-col items-center justify-center shrink-0", isCert ? "bg-info-soft" : "bg-primary-soft")}>
                    <span className={cn("text-[9px] uppercase leading-none", isCert ? "text-info/70" : "text-primary/70")}>Dia</span>
                    <span className={cn("text-sm font-bold leading-tight", isCert ? "text-info" : "text-primary")}>{r.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate flex items-center gap-1.5">
                      {isCert && <ShieldCheck className="h-3.5 w-3.5 text-info shrink-0" />}
                      {r.client}
                    </div>
                    <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{r.type}</div>
                  </div>
                  <div className="font-semibold text-sm tabular-nums">{brlCompact(r.value)}</div>
                </div>
              );
            })}
            {certData.monthValue === 0 && certData.nextUpcoming && (
              <div className="mt-3 p-2 rounded-lg border border-dashed border-info/40 bg-info-soft/30 text-xs text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-info shrink-0" />
                <span>
                  Próximo Cert. Digital: <strong className="text-foreground">{certData.nextUpcoming.date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong> — {brl(certData.nextUpcoming.value)}
                </span>
              </div>
            )}
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

function TotalPill({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" | "info" }) {
  const toneClass = {
    success: "bg-success-soft text-success border-success/20",
    warning: "bg-warning-soft text-warning border-warning/20",
    danger: "bg-destructive/10 text-destructive border-destructive/20",
    info: "bg-info-soft text-info border-info/20",
  }[tone];
  return (
    <div className={cn("rounded-lg border px-3 py-2", toneClass)}>
      <div className="text-[9px] font-semibold tracking-[0.15em] uppercase opacity-80">{label}</div>
      <div className="text-base font-bold tabular-nums mt-0.5">{brl(value)}</div>
    </div>
  );
}
