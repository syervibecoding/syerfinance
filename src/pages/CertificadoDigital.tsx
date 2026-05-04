import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { brl } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

const CLIENT_FIXED = "CM Contábil";
const CATEGORY = "Certificado Digital";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);

const monthKey = (m: number, y: number) => `${String(m + 1).padStart(2, "0")}/${y}`;
const parseMonthKey = (s: string): { m: number; y: number } | null => {
  const match = s?.match(/^(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return { m: Number(match[1]) - 1, y: Number(match[2]) };
};
const monthLabelFromKey = (s: string) => {
  const p = parseMonthKey(s);
  if (!p) return s;
  return `${MONTHS[p.m]}/${p.y}`;
};

const baseEmpty = {
  month: new Date().getMonth(),
  year: currentYear,
  value: 0,
  quantity: 0,
};

export default function CertificadoDigital() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ ...baseEmpty });

  const load = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("category", CATEGORY)
      .order("service_name", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const pa = parseMonthKey(a.service_name) ?? { m: 0, y: 0 };
      const pb = parseMonthKey(b.service_name) ?? { m: 0, y: 0 };
      if (pb.y !== pa.y) return pb.y - pa.y;
      return pb.m - pa.m;
    });
  }, [items]);

  const totals = useMemo(() => {
    const totalValue = items.reduce((s, i) => s + Number(i.value ?? 0), 0);
    const totalQty = items.reduce((s, i) => s + Number(i.recurrence_value ?? 0), 0);
    return { totalValue, totalQty };
  }, [items]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...baseEmpty });
    setOpen(true);
  };

  const openEdit = (it: any) => {
    const p = parseMonthKey(it.service_name);
    setEditing(it);
    setForm({
      month: p?.m ?? new Date().getMonth(),
      year: p?.y ?? currentYear,
      value: Number(it.value ?? 0),
      quantity: Number(it.recurrence_value ?? 0),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    const service_name = monthKey(Number(form.month), Number(form.year));

    const payload: any = {
      user_id: user.id,
      client: CLIENT_FIXED,
      category: CATEGORY,
      service_name,
      status: "Ativo",
      value: Number(form.value) || 0,
      recurrence_value: Number(form.quantity) || 0,
    };

    if (editing) {
      const { error } = await supabase.from("services").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("services").insert(payload);
      if (error) return toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
    toast({ title: "Salvo com sucesso" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificado Digital"
        subtitle={`Cliente: ${CLIENT_FIXED}`}
        onAdd={openNew}
        addLabel="Novo registro"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total faturado</div>
          <div className="text-2xl font-semibold">{brl(totals.totalValue)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total de certificados</div>
          <div className="text-2xl font-semibold">{totals.totalQty}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Meses registrados</div>
          <div className="text-2xl font-semibold">{items.length}</div>
        </Card>
      </div>

      {sorted.length === 0 ? (
        <EmptyState message="Nenhum registro ainda. Adicione o primeiro mês de certificado digital." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium capitalize">{monthLabelFromKey(it.service_name)}</TableCell>
                  <TableCell className="text-right">{Number(it.recurrence_value ?? 0)}</TableCell>
                  <TableCell className="text-right">{brl(Number(it.value ?? 0))}</TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(it)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar registro" : "Novo registro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Input value={CLIENT_FIXED} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mês</Label>
                <Select value={String(form.month)} onValueChange={(v) => setForm({ ...form, month: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano</Label>
                <Select value={String(form.year)} onValueChange={(v) => setForm({ ...form, year: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label>Valor total (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
            </div>
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
