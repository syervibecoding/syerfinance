import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { brl } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

const STATUSES = ["Pendente", "Em Produção", "Ativo", "Entregue", "Atrasado"] as const;
const PERIODS = ["Mensal", "Anual"] as const;

const baseEmpty = {
  client: "", service_name: "", status: "Pendente", value: 0,
  deadline: "", category: "Marketing",
  implementation_charged: 0, implementation_paid: 0,
  recurrence_value: 0, recurrence_period: "Mensal", recurrence_start_date: "",
  payment_day: null as number | null, traffic_reload_day: null as number | null,
  discount_percentage: 0, discount_type: "",
  has_contract: false, contract_end_date: "",
  last_recharge_value: 0, last_recharge_date: "", daily_spend: 0, traffic_balance: 0,
};

const statusVariant: Record<string, any> = {
  "Pendente": "secondary", "Em Produção": "default", "Ativo": "default",
  "Entregue": "outline", "Atrasado": "destructive",
};

interface Props {
  category: "Marketing" | "Sites" | "Plataformas";
  title: string;
}

export default function ServicesByCategory({ category, title }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ ...baseEmpty, category });

  const load = async () => {
    const { data } = await supabase.from("services").select("*").eq("category", category).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [category]);

  const openNew = () => { setEditing(null); setForm({ ...baseEmpty, category }); setOpen(true); };
  const openEdit = (it: any) => {
    setEditing(it);
    setForm({ ...baseEmpty, ...it,
      recurrence_start_date: it.recurrence_start_date ?? "",
      contract_end_date: it.contract_end_date ?? "",
      last_recharge_date: it.last_recharge_date ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    const payload: any = { ...form, user_id: user.id, category };
    ["value","implementation_charged","implementation_paid","recurrence_value","discount_percentage","last_recharge_value","daily_spend","traffic_balance"].forEach(k => payload[k] = Number(payload[k] ?? 0));
    ["payment_day","traffic_reload_day"].forEach(k => payload[k] = payload[k] ? Number(payload[k]) : null);
    ["recurrence_start_date","contract_end_date","last_recharge_date"].forEach(k => { if (!payload[k]) payload[k] = null; });
    if (!payload.recurrence_period) payload.recurrence_period = null;

    const res = editing
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editing ? "Atualizado" : "Criado" }); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este serviço?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else load();
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const totalMRR = useMemo(() => items.reduce((a, s) => a + Number(s.recurrence_value ?? 0), 0), [items]);
  const totalImpl = useMemo(() => items.reduce((a, s) => a + Number(s.implementation_charged ?? 0), 0), [items]);

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${items.length} serviços · MRR ${brl(totalMRR)} · Implementações ${brl(totalImpl)}`}
        onAdd={openNew} addLabel="Novo serviço"
      />

      {items.length === 0 ? <EmptyState message={`Nenhum serviço em ${title}.`} /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead><TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Implementação</TableHead>
                <TableHead className="text-right">Recorrência</TableHead>
                {category === "Marketing" && <TableHead className="text-right">Saldo / Diário</TableHead>}
                <TableHead>Prazo</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.client}</TableCell>
                  <TableCell>{it.service_name}</TableCell>
                  <TableCell><Badge variant={statusVariant[it.status]}>{it.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{brl(it.implementation_charged)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {it.recurrence_value ? `${brl(it.recurrence_value)}/${it.recurrence_period === "Anual" ? "ano" : "mês"}` : "-"}
                  </TableCell>
                  {category === "Marketing" && (
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {brl(it.traffic_balance)} <span className="text-xs">/ {brl(it.daily_spend)}d</span>
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">{it.deadline || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <Field label="Cliente"><Input value={form.client} onChange={e => set("client", e.target.value)} /></Field>
            <Field label="Nome do serviço"><Input value={form.service_name} onChange={e => set("service_name", e.target.value)} /></Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Valor cobrado (R$)"><Input type="number" step="0.01" value={form.value} onChange={e => set("value", e.target.value)} /></Field>

            <Field label="Implementação cobrada"><Input type="number" step="0.01" value={form.implementation_charged} onChange={e => set("implementation_charged", e.target.value)} /></Field>
            <Field label="Implementação paga"><Input type="number" step="0.01" value={form.implementation_paid} onChange={e => set("implementation_paid", e.target.value)} /></Field>

            <Field label="Recorrência (R$)"><Input type="number" step="0.01" value={form.recurrence_value} onChange={e => set("recurrence_value", e.target.value)} /></Field>
            <Field label="Período">
              <Select value={form.recurrence_period ?? ""} onValueChange={v => set("recurrence_period", v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Início recorrência"><Input type="date" value={form.recurrence_start_date} onChange={e => set("recurrence_start_date", e.target.value)} /></Field>
            <Field label="Dia de pagamento"><Input type="number" min={1} max={31} value={form.payment_day ?? ""} onChange={e => set("payment_day", e.target.value)} /></Field>
            <Field label="Prazo (texto livre)"><Input value={form.deadline} onChange={e => set("deadline", e.target.value)} placeholder="ex: 05 Abr" /></Field>

            {category === "Marketing" && (
              <>
                <div className="col-span-2 mt-2 pt-3 border-t">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tráfego de Anúncios</div>
                </div>
                <Field label="Última recarga (R$)"><Input type="number" step="0.01" value={form.last_recharge_value} onChange={e => set("last_recharge_value", e.target.value)} /></Field>
                <Field label="Data da última recarga"><Input type="date" value={form.last_recharge_date} onChange={e => set("last_recharge_date", e.target.value)} /></Field>
                <Field label="Gasto médio diário (R$)"><Input type="number" step="0.01" value={form.daily_spend} onChange={e => set("daily_spend", e.target.value)} /></Field>
                <Field label="Saldo atual (R$)"><Input type="number" step="0.01" value={form.traffic_balance} onChange={e => set("traffic_balance", e.target.value)} /></Field>
                <Field label="Dia de recarga preferido"><Input type="number" min={1} max={31} value={form.traffic_reload_day ?? ""} onChange={e => set("traffic_reload_day", e.target.value)} /></Field>
              </>
            )}

            <Field label="Tem contrato?">
              <div className="flex items-center h-10"><Switch checked={form.has_contract} onCheckedChange={v => set("has_contract", v)} /></div>
            </Field>
            <Field label="Fim do contrato"><Input type="date" value={form.contract_end_date} onChange={e => set("contract_end_date", e.target.value)} disabled={!form.has_contract} /></Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
