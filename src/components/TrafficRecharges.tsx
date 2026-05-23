import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl, fmtDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  serviceId: string | null;
  onChanged?: () => void;
}

export function TrafficRecharges({ serviceId, onChanged }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const load = async () => {
    if (!serviceId) return setItems([]);
    const { data } = await supabase
      .from("traffic_recharges")
      .select("*")
      .eq("service_id", serviceId)
      .order("recharge_date", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [serviceId]);

  if (!serviceId) {
    return <p className="text-xs text-muted-foreground">Salve o serviço para registrar recargas.</p>;
  }

  const add = async () => {
    if (!user || !value || Number(value) <= 0) {
      return toast({ title: "Informe um valor válido", variant: "destructive" });
    }
    const { error } = await supabase.from("traffic_recharges").insert({
      user_id: user.id, service_id: serviceId,
      value: Number(value), recharge_date: date, notes: notes || null,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    // Atualiza last_recharge_* no service (para o calendário de tráfego)
    await supabase.from("services").update({
      last_recharge_value: Number(value), last_recharge_date: date,
    }).eq("id", serviceId);
    setValue(""); setNotes(""); setDate(new Date().toISOString().slice(0, 10));
    load();
    onChanged?.();
    toast({ title: "Recarga registrada" });
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta recarga?")) return;
    const { error } = await supabase.from("traffic_recharges").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    load();
    onChanged?.();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-4">
          <label className="text-[10px] text-muted-foreground">Valor (R$)</label>
          <Input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0,00" />
        </div>
        <div className="col-span-3">
          <label className="text-[10px] text-muted-foreground">Data</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="col-span-4">
          <label className="text-[10px] text-muted-foreground">Observação</label>
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="opcional" />
        </div>
        <div className="col-span-1">
          <Button size="icon" onClick={add}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="border rounded-md divide-y">
          {items.map(r => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground tabular-nums">{fmtDate(r.recharge_date)}</span>
                <span className="font-medium tabular-nums">{brl(r.value)}</span>
                {r.notes && <span className="text-xs text-muted-foreground">· {r.notes}</span>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhuma recarga registrada.</p>
      )}
    </div>
  );
}
