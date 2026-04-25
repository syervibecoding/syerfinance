import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { brl } from "@/lib/format";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Payment {
  id: string;
  value: number;
  paid_date: string;
  notes: string | null;
}

interface Props {
  serviceId: string | null;
  charged: number;
  onTotalChange?: (total: number) => void;
}

export function ImplementationPayments({ serviceId, charged, onTotalChange }: Props) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adding, setAdding] = useState(false);
  const [newPay, setNewPay] = useState({ value: "", paid_date: new Date().toISOString().slice(0, 10), notes: "" });

  const load = async () => {
    if (!serviceId) { setPayments([]); return; }
    const { data } = await supabase
      .from("implementation_payments")
      .select("*")
      .eq("service_id", serviceId)
      .order("paid_date", { ascending: true });
    setPayments(data ?? []);
  };

  useEffect(() => { load(); }, [serviceId]);

  const total = payments.reduce((a, p) => a + Number(p.value), 0);
  const pct = charged > 0 ? Math.min(100, (total / charged) * 100) : 0;
  const remaining = Math.max(0, charged - total);

  useEffect(() => { onTotalChange?.(total); }, [total]);

  const add = async () => {
    if (!user || !serviceId) {
      toast({ title: "Salve o serviço primeiro", description: "Os pagamentos só podem ser adicionados após criar o serviço.", variant: "destructive" });
      return;
    }
    const value = Number(newPay.value);
    if (!value || value <= 0) { toast({ title: "Valor inválido", variant: "destructive" }); return; }
    const { error } = await supabase.from("implementation_payments").insert({
      user_id: user.id, service_id: serviceId, value,
      paid_date: newPay.paid_date, notes: newPay.notes || null,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewPay({ value: "", paid_date: new Date().toISOString().slice(0, 10), notes: "" });
    setAdding(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este pagamento?")) return;
    const { error } = await supabase.from("implementation_payments").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    load();
  };

  return (
    <div className="col-span-2 mt-2 pt-3 border-t space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pagamentos da implementação</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {brl(total)} / {brl(charged)} · Saldo {brl(remaining)}
        </div>
      </div>
      <Progress value={pct} className="h-1.5" />

      {!serviceId && (
        <div className="text-xs text-muted-foreground italic">Salve o serviço para registrar pagamentos.</div>
      )}

      {serviceId && (
        <>
          <div className="space-y-1.5">
            {payments.length === 0 && <div className="text-xs text-muted-foreground">Nenhum pagamento registrado.</div>}
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md bg-muted/40">
                <span className="text-muted-foreground tabular-nums w-20">{new Date(p.paid_date + "T00:00").toLocaleDateString("pt-BR")}</span>
                <span className="font-medium tabular-nums w-24">{brl(p.value)}</span>
                <span className="text-muted-foreground flex-1 truncate">{p.notes || "-"}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {adding ? (
            <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Data</label>
                <Input type="date" value={newPay.paid_date} onChange={e => setNewPay(p => ({ ...p, paid_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Valor</label>
                <Input type="number" step="0.01" placeholder="0,00" value={newPay.value} onChange={e => setNewPay(p => ({ ...p, value: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Observação</label>
                <Input placeholder="ex: 1ª parcela, PIX..." value={newPay.notes} onChange={e => setNewPay(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={add}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>X</Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Registrar pagamento
            </Button>
          )}
        </>
      )}
    </div>
  );
}
