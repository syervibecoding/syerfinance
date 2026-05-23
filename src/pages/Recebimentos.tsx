import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { brl } from "@/lib/format";
import { activeValue, monthKey, parseLocalDate, isPeriodDue, isContractActive } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, AlertTriangle, XCircle, RotateCcw, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type SourceType = "service" | "contract" | "company" | "implementation" | "certificate";
type Status = "paid" | "partial" | "pending" | "overdue" | "unpaid";

interface ExpectedRow {
  source_type: SourceType;
  source_id: string;
  client: string;
  origin: string;
  expected_value: number;
  due_day?: number | null;
  annual_not_due?: boolean;
  annual_due_month?: number | null; // 0-11
}

const STATUS_LABEL: Record<Status, string> = {
  paid: "Pago", partial: "Parcial", pending: "Pendente", overdue: "Atrasado", unpaid: "Não pago",
};
const STATUS_TONE: Record<Status, string> = {
  paid: "bg-success-soft text-success border-success/30",
  partial: "bg-info-soft text-info border-info/30",
  pending: "bg-secondary text-muted-foreground border-border",
  overdue: "bg-warning-soft text-warning border-warning/30",
  unpaid: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Recebimentos() {
  const { user } = useAuth();
  const [monthRef, setMonthRef] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [services, setServices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [implPays, setImplPays] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");

  const refKey = monthKey(monthRef);

  const load = async () => {
    const [s, c, co, ip, pr] = await Promise.all([
      supabase.from("services").select("*"),
      supabase.from("maintenance_contracts").select("*"),
      supabase.from("companies").select("*"),
      supabase.from("implementation_payments").select("*"),
      supabase.from("payment_records").select("*").eq("reference_month", refKey),
    ]);
    setServices(s.data ?? []);
    setContracts(c.data ?? []);
    setCompanies(co.data ?? []);
    setImplPays(ip.data ?? []);
    setRecords(pr.data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [refKey]);

  // Lista do que era esperado neste mês
  const expected: ExpectedRow[] = useMemo(() => {
    const list: ExpectedRow[] = [];
    const monthEnd = new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 0);

    services.filter(s => s.category !== "Certificado Digital" && Number(s.recurrence_value) > 0).forEach(s => {
      const start = parseLocalDate(s.recurrence_start_date);
      if (start && start > monthEnd) return;
      if (!isPeriodDue(s.recurrence_period, s.recurrence_start_date, monthRef)) return;
      if (!isContractActive(s, monthRef)) return;
      const val = activeValue(s.recurrence_value, s.next_recurrence_value, s.next_value_start, monthRef);
      list.push({
        source_type: "service", source_id: s.id, client: s.client,
        origin: `${s.category} · ${s.service_name}${s.recurrence_period === "Anual" ? " (anual)" : ""}`, expected_value: val, due_day: s.payment_day,
      });
    });

    contracts.filter(c => c.status === "Ativo").forEach(c => {
      const start = parseLocalDate(c.recurrence_start_date);
      if (start && start > monthEnd) return;
      const val = activeValue(c.monthly_value, c.next_monthly_value, c.next_value_start, monthRef);
      list.push({
        source_type: "contract", source_id: c.id, client: c.client,
        origin: "Manutenção", expected_value: val, due_day: c.payment_day,
      });
    });

    companies.forEach(co => {
      const v = activeValue(co.payment_value, co.next_payment_value, co.next_value_start, monthRef);
      if (!v) return;
      list.push({
        source_type: "company", source_id: co.id, client: co.name,
        origin: `Sociedade · ${co.role ?? ""}`.trim(), expected_value: v,
        due_day: co.payment_day ? Number(co.payment_day) : null,
      });
    });

    services.filter(s => s.category === "Certificado Digital" && s.recurrence_start_date && Number(s.value) > 0).forEach(s => {
      const d = parseLocalDate(s.recurrence_start_date);
      if (!d || d.getFullYear() !== monthRef.getFullYear() || d.getMonth() !== monthRef.getMonth()) return;
      list.push({
        source_type: "certificate", source_id: s.id, client: s.client,
        origin: "Certificado Digital", expected_value: Number(s.value), due_day: d.getDate(),
      });
    });

    return list.sort((a, b) => (a.due_day ?? 99) - (b.due_day ?? 99));
  }, [services, contracts, companies, monthRef]);

  // Pagamentos de implementação no mês (já realizados)
  const implInMonth = useMemo(() => {
    return implPays.filter(p => {
      const d = parseLocalDate(p.paid_date);
      return d && d.getFullYear() === monthRef.getFullYear() && d.getMonth() === monthRef.getMonth();
    });
  }, [implPays, monthRef]);

  // Indexa records por (source_type, source_id)
  const recordIndex = useMemo(() => {
    const m = new Map<string, any>();
    records.forEach(r => m.set(`${r.source_type}:${r.source_id}`, r));
    return m;
  }, [records]);

  // Linhas finais (mescla expected + records)
  const rows = useMemo(() => {
    const today = new Date();
    return expected.map(e => {
      const rec = recordIndex.get(`${e.source_type}:${e.source_id}`);
      let status: Status = (rec?.status as Status) ?? "pending";
      if (!rec) {
        const refKeyN = monthRef.getFullYear() * 12 + monthRef.getMonth();
        const todayKeyN = today.getFullYear() * 12 + today.getMonth();
        const isPastMonth = refKeyN < todayKeyN;
        const isCurrentOverdue = refKeyN === todayKeyN && e.due_day != null && today.getDate() > Number(e.due_day);
        if (isPastMonth || isCurrentOverdue) status = "overdue";
      }
      const received = Number(rec?.received_value ?? 0);
      return { ...e, status, received_value: received, paid_date: rec?.paid_date ?? null, notes: rec?.notes ?? "", record_id: rec?.id ?? null };
    });
  }, [expected, recordIndex, monthRef]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (filter !== "all" && r.status !== filter) return false;
      if (search && !`${r.client} ${r.origin}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, filter, search]);

  const totals = useMemo(() => {
    const previsto = rows.reduce((a, r) => a + r.expected_value, 0)
      + implInMonth.reduce((a, p) => a + Number(p.value), 0);
    const recebido = rows.reduce((a, r) => a + r.received_value, 0)
      + implInMonth.reduce((a, p) => a + Number(p.value), 0);
    const aberto = rows.filter(r => r.status !== "paid" && r.status !== "unpaid")
      .reduce((a, r) => a + (r.expected_value - r.received_value), 0);
    const inadimplente = rows.filter(r => r.status === "unpaid")
      .reduce((a, r) => a + r.expected_value, 0);
    return { previsto, recebido, aberto, inadimplente };
  }, [rows, implInMonth]);

  const upsertRecord = async (row: any, patch: Partial<{ status: Status; received_value: number; paid_date: string | null; notes: string }>) => {
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      source_type: row.source_type,
      source_id: row.source_id,
      client: row.client,
      reference_month: refKey,
      expected_value: row.expected_value,
      received_value: patch.received_value ?? row.received_value ?? 0,
      status: patch.status ?? row.status ?? "pending",
      paid_date: patch.paid_date ?? row.paid_date ?? null,
      notes: patch.notes ?? row.notes ?? null,
    };
    const { error } = await supabase.from("payment_records").upsert(payload, {
      onConflict: "user_id,source_type,source_id,reference_month",
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    load();
  };

  const markPaid = (row: any) =>
    upsertRecord(row, { status: "paid", received_value: row.expected_value, paid_date: new Date().toISOString().slice(0, 10) });
  const markUnpaid = (row: any) =>
    upsertRecord(row, { status: "unpaid", received_value: 0, paid_date: null });
  const reset = async (row: any) => {
    if (!row.record_id) return;
    await supabase.from("payment_records").delete().eq("id", row.record_id);
    load();
  };

  // Modal pagamento parcial
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialRow, setPartialRow] = useState<any>(null);
  const [partialValue, setPartialValue] = useState("");
  const [partialDate, setPartialDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [partialNotes, setPartialNotes] = useState("");
  const openPartial = (row: any) => {
    setPartialRow(row);
    setPartialValue(String(row.received_value || row.expected_value || ""));
    setPartialDate(row.paid_date ?? new Date().toISOString().slice(0, 10));
    setPartialNotes(row.notes ?? "");
    setPartialOpen(true);
  };
  const savePartial = async () => {
    const v = Number(partialValue);
    const status: Status = v <= 0 ? "unpaid" : v >= partialRow.expected_value ? "paid" : "partial";
    await upsertRecord(partialRow, { status, received_value: v, paid_date: v > 0 ? partialDate : null, notes: partialNotes });
    setPartialOpen(false);
  };

  const monthSubtitle = monthRef.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimentos"
        subtitle={`Controle previsto vs realizado · ${monthSubtitle}`}
        monthRef={monthRef}
        onMonthChange={(d) => { const x = new Date(d); x.setDate(1); setMonthRef(x); }}
      />

      {/* Totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <TotalCard label="Previsto" value={totals.previsto} tone="info" />
        <TotalCard label="Recebido" value={totals.recebido} tone="success" />
        <TotalCard label="Em aberto" value={totals.aberto} tone="warning" />
        <TotalCard label="Inadimplência" value={totals.inadimplente} tone="danger" />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Input placeholder="Buscar cliente ou origem..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="partial">Parciais</SelectItem>
              <SelectItem value="overdue">Atrasados</SelectItem>
              <SelectItem value="unpaid">Não pagos</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} de {rows.length} cobranças</span>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-center">Dia</TableHead>
              <TableHead className="text-right">Previsto</TableHead>
              <TableHead className="text-right">Recebido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data pgto</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Nenhuma cobrança neste filtro.</TableCell></TableRow>
            )}
            {filtered.map((r, i) => (
              <TableRow key={`${r.source_type}-${r.source_id}-${i}`}>
                <TableCell className="font-medium">{r.client}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.origin}</TableCell>
                <TableCell className="text-center">{r.due_day ?? "-"}</TableCell>
                <TableCell className="text-right tabular-nums">{brl(r.expected_value)}</TableCell>
                <TableCell className={cn("text-right tabular-nums", r.received_value > 0 && "text-success font-medium")}>
                  {r.received_value > 0 ? brl(r.received_value) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border", STATUS_TONE[r.status])}>{STATUS_LABEL[r.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.paid_date ? new Date(r.paid_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" title="Marcar como pago" onClick={() => markPaid(r)}>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Pagamento parcial" onClick={() => openPartial(r)}>
                      <DollarSign className="h-4 w-4 text-info" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Marcar como não pago" onClick={() => markUnpaid(r)}>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                    {r.record_id && (
                      <Button size="sm" variant="ghost" title="Desfazer" onClick={() => reset(r)}>
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {/* Linhas auto de implementação (já realizadas) */}
            {implInMonth.map(p => {
              const svc = services.find(s => s.id === p.service_id);
              return (
                <TableRow key={`impl-${p.id}`} className="bg-success-soft/20">
                  <TableCell className="font-medium">{svc?.client ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Implementação · {svc?.service_name ?? ""}</TableCell>
                  <TableCell className="text-center">{new Date(p.paid_date).getDate()}</TableCell>
                  <TableCell className="text-right tabular-nums">{brl(p.value)}</TableCell>
                  <TableCell className="text-right tabular-nums text-success font-medium">{brl(p.value)}</TableCell>
                  <TableCell><Badge variant="outline" className={cn("border", STATUS_TONE.paid)}>Pago</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(p.paid_date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground italic">automático</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Modal parcial */}
      <Dialog open={partialOpen} onOpenChange={setPartialOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pagamento — {partialRow?.client}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Previsto: <strong className="text-foreground">{brl(partialRow?.expected_value ?? 0)}</strong>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valor recebido (R$)</Label>
              <Input type="number" step="0.01" value={partialValue} onChange={e => setPartialValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data do pagamento</Label>
              <Input type="date" value={partialDate} onChange={e => setPartialDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observação</Label>
              <Input value={partialNotes} onChange={e => setPartialNotes(e.target.value)} placeholder="ex: pagou só metade" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPartialOpen(false)}>Cancelar</Button>
            <Button onClick={savePartial}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TotalCard({ label, value, tone }: { label: string; value: number; tone: "info" | "success" | "warning" | "danger" }) {
  const cls = {
    info: "bg-info-soft text-info border-info/20",
    success: "bg-success-soft text-success border-success/20",
    warning: "bg-warning-soft text-warning border-warning/20",
    danger: "bg-destructive/10 text-destructive border-destructive/20",
  }[tone];
  return (
    <div className={cn("rounded-lg border px-4 py-3", cls)}>
      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase opacity-80">{label}</div>
      <div className="text-xl font-bold tabular-nums mt-1">{brl(value)}</div>
    </div>
  );
}
