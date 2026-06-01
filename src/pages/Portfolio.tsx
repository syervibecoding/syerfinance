import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { brl } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Building2 } from "lucide-react";

const empty = { name: "", role: "", equity: 0, payment_day: "", payment_value: 0, next_payment_value: "", next_value_start: "" };

export default function Portfolio() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: any) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!user) return;
    const payload: any = { ...form, user_id: user.id, equity: Number(form.equity), payment_value: Number(form.payment_value) };
    payload.next_payment_value = form.next_payment_value === "" || form.next_payment_value == null ? null : Number(form.next_payment_value);
    payload.next_value_start = form.next_value_start || null;
    const res = editing
      ? await supabase.from("companies").update(payload).eq("id", editing.id)
      : await supabase.from("companies").insert(payload);
    if (res.error) toast({ title: "Erro", description: res.error.message, variant: "destructive" });
    else { toast({ title: editing ? "Atualizado" : "Criado" }); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir empresa?")) return;
    await supabase.from("companies").delete().eq("id", id);
    load();
  };

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const currentValue = (it: any) => {
    if (it.next_payment_value != null && it.next_value_start && new Date(it.next_value_start) <= new Date()) {
      return Number(it.next_payment_value);
    }
    return Number(it.payment_value);
  };

  const totalReceita = items.reduce((a, i) => a + currentValue(i), 0);

  return (
    <div>
      <PageHeader title="Portfólio" subtitle={`${items.length} empresas · ${brl(totalReceita)} em pró-labore mensal`} onAdd={openNew} addLabel="Nova empresa" />

      {items.length === 0 ? <EmptyState message="Nenhuma empresa cadastrada." /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(it => (
            <Card key={it.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0"><Building2 className="h-5 w-5 text-muted-foreground" /></div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{it.name}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{it.role}</p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">{it.equity}%</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pró-labore</span><span className="font-medium tabular-nums">{brl(it.payment_value)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dia pagto</span><span className="font-medium">{it.payment_day || "-"}</span></div>
                <div className="flex gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(it)}><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => remove(it.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar empresa" : "Nova empresa"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <F label="Nome"><Input value={form.name} onChange={e => set("name", e.target.value)} /></F>
            <F label="Cargo / Papel"><Input value={form.role} onChange={e => set("role", e.target.value)} placeholder="Sócio, CEO..." /></F>
            <F label="Equity (%)"><Input type="number" step="0.01" value={form.equity} onChange={e => set("equity", e.target.value)} /></F>
            <F label="Dia de pagamento"><Input value={form.payment_day} onChange={e => set("payment_day", e.target.value)} placeholder="ex: 5" /></F>
            <div className="col-span-2"><F label="Valor mensal (pró-labore)"><Input type="number" step="0.01" value={form.payment_value} onChange={e => set("payment_value", e.target.value)} /></F></div>
            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reajuste futuro (opcional)</p>
              <div className="grid grid-cols-2 gap-4">
                <F label="Novo valor mensal"><Input type="number" step="0.01" value={form.next_payment_value} onChange={e => set("next_payment_value", e.target.value)} placeholder="ex: 5500" /></F>
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
