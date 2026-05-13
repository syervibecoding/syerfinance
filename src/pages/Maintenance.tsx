import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { brl } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, ExternalLink } from "lucide-react";

const empty = { client: "", url: "", monthly_value: 0, status: "Ativo", last_check: "", recurrence_start_date: "", payment_day: null as any, next_monthly_value: "", next_value_start: "" };

export default function Maintenance() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("maintenance_contracts").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: any) => { setEditing(it); setForm({ ...empty, ...it, recurrence_start_date: it.recurrence_start_date ?? "" }); setOpen(true); };

  const save = async () => {
    if (!user) return;
    const payload: any = { ...form, user_id: user.id, monthly_value: Number(form.monthly_value), payment_day: form.payment_day ? Number(form.payment_day) : null };
    payload.next_monthly_value = form.next_monthly_value === "" || form.next_monthly_value == null ? null : Number(form.next_monthly_value);
    payload.next_value_start = form.next_value_start || null;
    if (!payload.recurrence_start_date) payload.recurrence_start_date = null;
    const res = editing
      ? await supabase.from("maintenance_contracts").update(payload).eq("id", editing.id)
      : await supabase.from("maintenance_contracts").insert(payload);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editing ? "Atualizado" : "Criado" }); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir contrato?")) return;
    const { error } = await supabase.from("maintenance_contracts").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else load();
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const totalMRR = items.filter(i => i.status === "Ativo").reduce((a, i) => a + Number(i.monthly_value), 0);

  return (
    <div>
      <PageHeader title="Manutenção" subtitle={`MRR ativo: ${brl(totalMRR)}`} onAdd={openNew} addLabel="Novo contrato" />

      {items.length === 0 ? <EmptyState message="Nenhum contrato de manutenção." /> : (
        <Card>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Cliente</TableHead><TableHead>URL</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Mensal</TableHead>
              <TableHead>Último check</TableHead><TableHead>Dia pagto</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.client}</TableCell>
                  <TableCell><a href={it.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">{it.url}<ExternalLink className="h-3 w-3" /></a></TableCell>
                  <TableCell><Badge variant={it.status === "Ativo" ? "default" : "secondary"}>{it.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{brl(it.monthly_value)}</TableCell>
                  <TableCell className="text-muted-foreground">{it.last_check || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{it.payment_day || "-"}</TableCell>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar contrato" : "Novo contrato"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <F label="Cliente"><Input value={form.client} onChange={e => set("client", e.target.value)} /></F>
            <F label="URL do site"><Input value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://..." /></F>
            <F label="Valor mensal"><Input type="number" step="0.01" value={form.monthly_value} onChange={e => set("monthly_value", e.target.value)} /></F>
            <F label="Status">
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Pausado">Pausado</SelectItem></SelectContent>
              </Select>
            </F>
            <F label="Último check"><Input value={form.last_check} onChange={e => set("last_check", e.target.value)} placeholder="Hoje, 09:00" /></F>
            <F label="Dia de pagamento"><Input type="number" min={1} max={31} value={form.payment_day ?? ""} onChange={e => set("payment_day", e.target.value)} /></F>
            <F label="Início recorrência"><Input type="date" value={form.recurrence_start_date} onChange={e => set("recurrence_start_date", e.target.value)} /></F>
            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reajuste futuro (opcional)</p>
              <div className="grid grid-cols-2 gap-4">
                <F label="Novo valor mensal"><Input type="number" step="0.01" value={form.next_monthly_value} onChange={e => set("next_monthly_value", e.target.value)} placeholder="ex: 850" /></F>
                <F label="A partir de"><Input type="date" value={form.next_value_start} onChange={e => set("next_value_start", e.target.value)} /></F>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">O passado fica intacto. A partir do mês informado, o novo valor entra no fluxo.</p>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function F({ label, children }: any) { return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>; }
