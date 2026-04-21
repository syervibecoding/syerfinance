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
import { Pencil, Trash2, RotateCcw } from "lucide-react";

const empty = { description: "", value: 0, category: "", due_date: "", status: "Pendente", is_recurring: false };

export default function Expenses() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("expenses").select("*").order("due_date", { ascending: true });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: any) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!user) return;
    const payload: any = { ...form, user_id: user.id, value: Number(form.value) };
    if (!payload.due_date) { toast({ title: "Vencimento obrigatório", variant: "destructive" }); return; }
    const res = editing
      ? await supabase.from("expenses").update(payload).eq("id", editing.id)
      : await supabase.from("expenses").insert(payload);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editing ? "Atualizado" : "Criado" }); setOpen(false); load(); }
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
  const totalPending = items.filter(i => i.status === "Pendente").reduce((a, i) => a + Number(i.value), 0);
  const totalPaid = items.filter(i => i.status === "Pago").reduce((a, i) => a + Number(i.value), 0);

  return (
    <div>
      <PageHeader title="Despesas" subtitle={`Pendente: ${brl(totalPending)}  ·  Pago: ${brl(totalPaid)}`} onAdd={openNew} addLabel="Nova despesa" />

      {items.length === 0 ? <EmptyState message="Sem despesas registradas." /> : (
        <Card>
          <Table>
            <TableHeader><TableRow>
              <TableHead></TableHead><TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead><TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="w-8 text-muted-foreground">{it.is_recurring && <RotateCcw className="h-3.5 w-3.5" />}</TableCell>
                  <TableCell className="font-medium">{it.description}</TableCell>
                  <TableCell><Badge variant="outline">{it.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(it.due_date)}</TableCell>
                  <TableCell className="text-right tabular-nums">{brl(it.value)}</TableCell>
                  <TableCell>
                    <button onClick={() => togglePaid(it)}>
                      <Badge variant={it.status === "Pago" ? "default" : "secondary"} className="cursor-pointer">{it.status}</Badge>
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
            <F label="Valor"><Input type="number" step="0.01" value={form.value} onChange={e => set("value", e.target.value)} /></F>
            <F label="Vencimento"><Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} /></F>
            <F label="Status">
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Pago">Pago</SelectItem></SelectContent>
              </Select>
            </F>
            <div className="col-span-2 flex items-center justify-between border rounded-md p-3">
              <div><div className="text-sm font-medium">Despesa recorrente</div><div className="text-xs text-muted-foreground">Repete mensalmente</div></div>
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
