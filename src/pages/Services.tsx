import { useEffect, useState } from "react";
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
import { brl, fmtDate } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

const STATUSES = ["Pendente", "Em Produção", "Entregue", "Atrasado"] as const;
const CATEGORIES = ["Marketing", "Plataformas", "Web Ops", "Sites"] as const;
const PERIODS = ["Mensal", "Anual"] as const;

const empty = {
  client: "", service_name: "", status: "Pendente", value: 0,
  deadline: "", category: "Marketing",
  implementation_charged: 0, implementation_paid: 0,
  recurrence_value: 0, recurrence_period: "Mensal", recurrence_start_date: "",
  payment_day: null as number | null, traffic_reload_day: null as number | null,
  discount_percentage: 0, discount_type: "",
  has_contract: false, contract_end_date: "",
};

const statusVariant: Record<string, any> = {
  "Pendente": "secondary", "Em Produção": "default",
  "Entregue": "outline", "Atrasado": "destructive",
};

export default function Services() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: any) => {
    setEditing(it);
    setForm({ ...empty, ...it, recurrence_start_date: it.recurrence_start_date ?? "", contract_end_date: it.contract_end_date ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    const payload: any = { ...form, user_id: user.id };
    ["value","implementation_charged","implementation_paid","recurrence_value","discount_percentage"].forEach(k => payload[k] = Number(payload[k] ?? 0));
    ["payment_day","traffic_reload_day"].forEach(k => payload[k] = payload[k] ? Number(payload[k]) : null);
    ["recurrence_start_date","contract_end_date"].forEach(k => { if (!payload[k]) payload[k] = null; });
    if (!payload.recurrence_period) payload.recurrence_period = null;

    const res = editing
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editing ? "Serviço atualizado" : "Serviço criado" }); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este serviço?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Excluído" }); load(); }
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader title="Serviços" subtitle="Jobs e contratos com clientes" onAdd={openNew} addLabel="Novo serviço" />

      {items.length === 0 ? <EmptyState message="Nenhum serviço ainda. Clique em 'Novo serviço' para começar." /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead><TableHead>Serviço</TableHead>
                <TableHead>Categoria</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Recorrência</TableHead>
                <TableHead>Prazo</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.client}</TableCell>
                  <TableCell>{it.service_name}</TableCell>
                  <TableCell><Badge variant="outline">{it.category}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant[it.status]}>{it.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{brl(it.value)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {it.recurrence_value ? `${brl(it.recurrence_value)}/${it.recurrence_period === "Anual" ? "ano" : "mês"}` : "-"}
                  </TableCell>
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
            <Field label="Categoria">
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.value} onChange={e => set("value", e.target.value)} /></Field>
            <Field label="Prazo (texto livre)"><Input value={form.deadline} onChange={e => set("deadline", e.target.value)} placeholder="ex: 05 Abr" /></Field>

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
            <Field label="Dia de recarga (Marketing)"><Input type="number" min={1} max={31} value={form.traffic_reload_day ?? ""} onChange={e => set("traffic_reload_day", e.target.value)} /></Field>

            <Field label="Desconto (%)"><Input type="number" step="0.01" value={form.discount_percentage} onChange={e => set("discount_percentage", e.target.value)} /></Field>
            <Field label="Tipo de desconto"><Input value={form.discount_type} onChange={e => set("discount_type", e.target.value)} placeholder="Pix, Fidelidade..." /></Field>

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
