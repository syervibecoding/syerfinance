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
import { brl, fmtDate, sameMonth } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, RotateCcw, Layers } from "lucide-react";

const empty = {
  description: "", value: 0, category: "", due_date: "", status: "Pendente",
  is_recurring: false, installments_total: 1, installments_current: 1,
};

export default function Expenses() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [monthRef, setMonthRef] = useState(new Date());

  const load = async () => {
    const { data } = await supabase.from("expenses").select("*").order("due_date", { ascending: true });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: any) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!user) return;
    if (!form.due_date) { toast({ title: "Vencimento obrigatório", variant: "destructive" }); return; }
    const baseValue = Number(form.value);
    const total = Math.max(1, Number(form.installments_total ?? 1));

    // Calcula vencimento mantendo o dia desejado; se o mês não tiver, usa o último dia útil
    const computeDueDate = (baseISO: string, monthsAhead: number) => {
      const [yStr, mStr, dStr] = baseISO.split("-");
      const desiredDay = Number(dStr);
      const target = new Date(Number(yStr), Number(mStr) - 1 + monthsAhead, 1);
      const lastDayOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      let day = Math.min(desiredDay, lastDayOfMonth);
      let d = new Date(target.getFullYear(), target.getMonth(), day);
      // Se o dia desejado não existe no mês (ex: 30 em fev), volta ao último dia útil
      if (desiredDay > lastDayOfMonth) {
        while (d.getDay() === 0 || d.getDay() === 6) {
          d.setDate(d.getDate() - 1);
        }
      }
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    if (!editing && form.is_recurring) {
      // Recorrente: cria 12 meses adiante (renováveis depois)
      const rows = Array.from({ length: 12 }).map((_, i) => {
        return {
          user_id: user.id,
          description: form.description,
          value: baseValue,
          category: form.category,
          due_date: computeDueDate(form.due_date, i),
          status: i === 0 ? form.status : "Pendente",
          is_recurring: true,
          installments_total: 1,
          installments_current: 1,
        };
      });
      const { error } = await supabase.from("expenses").insert(rows);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Despesa recorrente criada", description: "12 meses lançados no fluxo." });
    } else if (!editing && total > 1) {
      // Cria parcelas
      const parentDate = new Date(form.due_date);
      const rows = Array.from({ length: total }).map((_, i) => {
        const d = new Date(parentDate);
        d.setMonth(d.getMonth() + i);
        return {
          user_id: user.id,
          description: `${form.description} (${i + 1}/${total})`,
          value: baseValue,
          category: form.category,
          due_date: d.toISOString().slice(0, 10),
          status: i === 0 ? form.status : "Pendente",
          is_recurring: false,
          installments_total: total,
          installments_current: i + 1,
        };
      });
      const { error } = await supabase.from("expenses").insert(rows);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: `${total} parcelas criadas` });
    } else {
      const payload: any = { ...form, user_id: user.id, value: baseValue,
        installments_total: total, installments_current: Number(form.installments_current ?? 1) };
      const res = editing
        ? await supabase.from("expenses").update(payload).eq("id", editing.id)
        : await supabase.from("expenses").insert(payload);
      if (res.error) { toast({ title: "Erro", description: res.error.message, variant: "destructive" }); return; }
      toast({ title: editing ? "Atualizado" : "Criado" });
    }
    setOpen(false); load();
  };

  const togglePaid = async (it: any) => {
    const next = it.status === "Pago" ? "Pendente" : "Pago";
    await supabase.from("expenses").update({ status: next }).eq("id", it.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir despesa?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    load();
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const monthItems = useMemo(() => items.filter(i => sameMonth(i.due_date, monthRef)), [items, monthRef]);
  const totalPending = monthItems.filter(i => i.status === "Pendente").reduce((a, i) => a + Number(i.value), 0);
  const totalPaid = monthItems.filter(i => i.status === "Pago").reduce((a, i) => a + Number(i.value), 0);

  return (
    <div>
      <PageHeader
        title="Despesas & Custos"
        subtitle={`Pendente: ${brl(totalPending)} · Pago: ${brl(totalPaid)} · ${monthItems.length} no mês`}
        onAdd={openNew} addLabel="Nova despesa"
        monthRef={monthRef} onMonthChange={setMonthRef}
      />

      {monthItems.length === 0 ? <EmptyState message="Sem despesas neste mês." /> : (
        <Card>
          <Table>
            <TableHeader><TableRow>
              <TableHead></TableHead><TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead><TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {monthItems.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="w-8 text-muted-foreground">
                    {it.is_recurring ? <RotateCcw className="h-3.5 w-3.5" /> :
                     it.installments_total > 1 ? <Layers className="h-3.5 w-3.5" /> : null}
                  </TableCell>
                  <TableCell className="font-medium">
                    {it.description}
                    {it.installments_total > 1 && <span className="text-xs text-muted-foreground ml-2">{it.installments_current}/{it.installments_total}</span>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{it.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(it.due_date)}</TableCell>
                  <TableCell className="text-right tabular-nums">{brl(it.value)}</TableCell>
                  <TableCell>
                    <button onClick={() => togglePaid(it)}>
                      <Badge className={it.status === "Pago" ? "bg-success text-success-foreground hover:bg-success cursor-pointer" : "bg-warning text-warning-foreground hover:bg-warning cursor-pointer"}>{it.status}</Badge>
                    </button>
                  </TableCell>
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
          <DialogHeader><DialogTitle>{editing ? "Editar despesa" : "Nova despesa"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label className="text-xs">Descrição</Label><Input value={form.description} onChange={e => set("description", e.target.value)} /></div>
            <F label="Categoria"><Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="Software, Equipe..." /></F>
            <F label="Valor (por parcela)"><Input type="number" step="0.01" value={form.value} onChange={e => set("value", e.target.value)} /></F>
            <F label="1º vencimento"><Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} /></F>
            <F label="Status">
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Pago">Pago</SelectItem></SelectContent>
              </Select>
            </F>
            <F label="Nº de parcelas">
              <Input type="number" min={1} max={36} value={form.installments_total}
                onChange={e => set("installments_total", e.target.value)} disabled={!!editing} />
            </F>
            <div className="col-span-2 flex items-center justify-between border rounded-lg p-3">
              <div><div className="text-sm font-medium">Despesa recorrente mensal</div><div className="text-xs text-muted-foreground">Repete todo mês indefinidamente</div></div>
              <Switch checked={form.is_recurring} onCheckedChange={v => set("is_recurring", v)} />
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function F({ label, children }: any) { return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>; }
