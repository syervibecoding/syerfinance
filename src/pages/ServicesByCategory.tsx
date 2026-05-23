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
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { ImplementationPayments } from "@/components/ImplementationPayments";
import { TrafficRecharges } from "@/components/TrafficRecharges";
import { brl } from "@/lib/format";
import { computeContractEnd, monthsBetween } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = ["Pendente", "Em Produção", "Ativo", "Entregue", "Atrasado"] as const;
const PERIODS = ["Mensal", "Anual"] as const;

const baseEmpty = {
  client: "", service_name: "", status: "Pendente", value: 0,
  deadline: "", category: "Marketing",
  implementation_charged: 0,
  recurrence_value: 0, recurrence_period: "Mensal", recurrence_start_date: "",
  next_recurrence_value: "", next_value_start: "",
  payment_day: null as number | null, traffic_reload_day: null as number | null,
  discount_percentage: 0, discount_type: "",
  has_contract: false, contract_end_date: "",
  last_recharge_value: 0, last_recharge_date: "", daily_spend: 0, traffic_balance: 0,
  split_payment: false, payment_day_2: null as number | null,
};

const statusVariant: Record<string, any> = {
  "Pendente": "secondary", "Em Produção": "default", "Ativo": "default",
  "Entregue": "outline", "Atrasado": "destructive",
};

interface Props {
  category: "Marketing" | "Sites" | "Plataformas" | "Certificado Digital";
  title: string;
}

export default function ServicesByCategory({ category, title }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [paidByService, setPaidByService] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ ...baseEmpty, category });

  const load = async () => {
    const { data } = await supabase.from("services").select("*").eq("category", category).order("created_at", { ascending: false });
    setItems(data ?? []);
    const ids = (data ?? []).map(d => d.id);
    if (ids.length) {
      const { data: pays } = await supabase.from("implementation_payments").select("service_id, value").in("service_id", ids);
      const totals: Record<string, number> = {};
      (pays ?? []).forEach(p => { totals[p.service_id] = (totals[p.service_id] ?? 0) + Number(p.value); });
      setPaidByService(totals);
    } else setPaidByService({});
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
    // Validação básica
    if (!form.client?.trim() || !form.service_name?.trim()) {
      return toast({ title: "Campos obrigatórios", description: "Preencha Cliente e Nome do serviço.", variant: "destructive" });
    }
    if (Number(form.recurrence_value) > 0) {
      if (!form.recurrence_start_date || !form.payment_day) {
        return toast({
          title: "Recorrência incompleta",
          description: "Para recorrência, informe Início e Dia de pagamento (necessário para o fluxo de caixa).",
          variant: "destructive",
        });
      }
    }

    const payload: any = { ...form, user_id: user.id, category };
    // Mantém compat: se há recorrência, replica para 'value'; senão preserva o valor digitado
    if (Number(payload.recurrence_value) > 0 && category !== "Certificado Digital") {
      payload.value = Number(payload.recurrence_value);
    }
    ["value","implementation_charged","recurrence_value","discount_percentage","last_recharge_value","daily_spend","traffic_balance"].forEach(k => payload[k] = Number(payload[k] ?? 0));
    ["payment_day","traffic_reload_day","payment_day_2"].forEach(k => payload[k] = payload[k] ? Number(payload[k]) : null);
    ["recurrence_start_date","contract_end_date","last_recharge_date","next_value_start"].forEach(k => { if (!payload[k]) payload[k] = null; });
    payload.next_recurrence_value = form.next_recurrence_value === "" || form.next_recurrence_value == null ? null : Number(form.next_recurrence_value);
    if (!payload.recurrence_period) payload.recurrence_period = null;
    delete payload.implementation_paid;

    if (editing) {
      const { error } = await supabase.from("services").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
      toast({ title: "Atualizado" });
      load();
      setOpen(false);
    } else {
      const { data, error } = await supabase.from("services").insert(payload).select().single();
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
      toast({ title: "Serviço criado", description: "Agora você pode registrar pagamentos da implementação." });
      setEditing(data);
      load();
    }
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

  const handleDialogClose = (v: boolean) => {
    setOpen(v);
    if (!v) load();
  };

  const isMarketing = category === "Marketing";
  const isCert = category === "Certificado Digital";

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
                <TableHead className="text-right min-w-[180px]">Implementação</TableHead>
                <TableHead className="text-right">Recorrência</TableHead>
                {isMarketing && <TableHead className="text-right">Saldo / Diário</TableHead>}
                <TableHead>Prazo</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(it => {
                const charged = Number(it.implementation_charged ?? 0);
                const paid = paidByService[it.id] ?? 0;
                const pct = charged > 0 ? Math.min(100, (paid / charged) * 100) : 0;
                return (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.client}</TableCell>
                  <TableCell>{it.service_name}</TableCell>
                  <TableCell><Badge variant={statusVariant[it.status]}>{it.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">
                    {charged > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className={paid >= charged ? "text-foreground font-medium" : "text-muted-foreground"}>{brl(paid)}</span>
                          <span className="text-muted-foreground"> / {brl(charged)}</span>
                        </div>
                        <Progress value={pct} className="h-1" />
                      </div>
                    ) : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {it.recurrence_value ? `${brl(it.recurrence_value)}/${it.recurrence_period === "Anual" ? "ano" : "mês"}` : "-"}
                  </TableCell>
                  {isMarketing && (
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
              );})}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Editar serviço — {editing.client}
                </>
              ) : "Novo serviço"}
            </DialogTitle>
            {editing && (
              <p className="text-xs text-muted-foreground mt-1">
                Serviço salvo. Você pode registrar pagamentos da implementação na seção abaixo.
              </p>
            )}
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* SEÇÃO 1: Identificação */}
            <Section title="Identificação">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Cliente" required>
                  <Input value={form.client} onChange={e => set("client", e.target.value)} placeholder="Nome do cliente" />
                </Field>
                <Field label="Nome do serviço" required>
                  <Input value={form.service_name} onChange={e => set("service_name", e.target.value)} placeholder="Ex: Gestão de tráfego" />
                </Field>
                <Field label="Status">
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Prazo (texto livre)">
                  <Input value={form.deadline} onChange={e => set("deadline", e.target.value)} placeholder="ex: 05 Abr" />
                </Field>
              </div>
            </Section>

            {/* SEÇÃO 2: Cobrança recorrente (oculta para Cert. Digital) */}
            {!isCert && (
              <Section
                title="Cobrança recorrente"
                hint="Define o que entra mensalmente no fluxo de caixa do Dashboard."
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Valor da recorrência (R$)"
                    helper="Deixe 0 se for serviço pontual sem mensalidade."
                  >
                    <Input type="number" step="0.01" value={form.recurrence_value} onChange={e => set("recurrence_value", e.target.value)} />
                  </Field>
                  <Field label="Período">
                    <Select value={form.recurrence_period ?? ""} onValueChange={v => set("recurrence_period", v)}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label="Início da recorrência"
                    required={Number(form.recurrence_value) > 0}
                    helper="A partir desta data o valor entra no fluxo mensal."
                  >
                    <Input type="date" value={form.recurrence_start_date} onChange={e => set("recurrence_start_date", e.target.value)} />
                  </Field>
                  <Field
                    label="Dia de pagamento"
                    required={Number(form.recurrence_value) > 0}
                    helper="Aparece no Calendário de Recebimentos."
                  >
                    <Input type="number" min={1} max={31} value={form.payment_day ?? ""} onChange={e => set("payment_day", e.target.value)} placeholder="1-31" />
                  </Field>
                  <Field label="Pagamento dividido (50/50)?">
                    <div className="flex items-center h-10">
                      <Switch checked={form.split_payment} onCheckedChange={v => set("split_payment", v)} />
                    </div>
                  </Field>
                  {form.split_payment && (
                    <Field label="2º dia de pagamento">
                      <Input type="number" min={1} max={31} value={form.payment_day_2 ?? ""} onChange={e => set("payment_day_2", e.target.value)} placeholder="ex: 20" />
                    </Field>
                  )}
                </div>
                <div className="border-t mt-4 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reajuste futuro (opcional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Novo valor da recorrência" helper="O passado fica intacto.">
                      <Input type="number" step="0.01" value={form.next_recurrence_value} onChange={e => set("next_recurrence_value", e.target.value)} placeholder="ex: 1500" />
                    </Field>
                    <Field label="A partir de" helper="Mês em que o novo valor passa a valer.">
                      <Input type="date" value={form.next_value_start} onChange={e => set("next_value_start", e.target.value)} />
                    </Field>
                  </div>
                </div>
              </Section>
            )}

            {/* SEÇÃO Cert. Digital: valor pontual */}
            {isCert && (
              <Section title="Registro do mês" hint="Cada certificado entra no fluxo no mês informado.">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valor (R$)" required>
                    <Input type="number" step="0.01" value={form.value} onChange={e => set("value", e.target.value)} />
                  </Field>
                  <Field label="Quantidade">
                    <Input type="number" value={form.recurrence_value} onChange={e => set("recurrence_value", e.target.value)} />
                  </Field>
                  <Field label="Mês de referência" required helper="Define em qual mês entra no fluxo de caixa.">
                    <Input type="date" value={form.recurrence_start_date} onChange={e => set("recurrence_start_date", e.target.value)} />
                  </Field>
                </div>
              </Section>
            )}

            {/* SEÇÃO 3: Implementação (apenas Projetos & Plataformas e Sites) */}
            {(category === "Plataformas" || category === "Sites") && (
              <Section title="Implementação (cobrança única)" hint="Valor cobrado uma única vez pela montagem/setup.">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <Field label="Valor cobrado (R$)">
                    <Input type="number" step="0.01" value={form.implementation_charged} onChange={e => set("implementation_charged", e.target.value)} />
                  </Field>
                  <Field label="% de desconto" helper="Ex: 10 (sem o símbolo %).">
                    <Input type="number" step="0.01" min={0} max={100} value={form.discount_percentage} onChange={e => set("discount_percentage", e.target.value)} placeholder="0" />
                  </Field>
                  <Field label="Condição do desconto" helper="Ex: 'no Pix', 'à vista', '1ª parcela'.">
                    <Input value={form.discount_type ?? ""} onChange={e => set("discount_type", e.target.value)} placeholder="ex: no Pix" />
                  </Field>
                  {Number(form.implementation_charged) > 0 && Number(form.discount_percentage) > 0 && (
                    <Field label="Valor com desconto">
                      <div className="h-10 flex items-center px-3 rounded-md bg-success-soft text-success text-sm font-semibold tabular-nums">
                        {brl(Number(form.implementation_charged) * (1 - Number(form.discount_percentage) / 100))}
                        {form.discount_type && <span className="ml-1.5 text-[10px] font-normal opacity-80">({form.discount_type})</span>}
                      </div>
                    </Field>
                  )}
                </div>
                <div className={cn("rounded-lg", editing && Number(form.implementation_charged) > 0 && "border border-accent/40 p-3 bg-accent/5")}>
                  <ImplementationPayments
                    serviceId={editing?.id ?? null}
                    charged={Number(form.implementation_charged ?? 0)}
                    discountPercentage={form.discount_percentage}
                    discountType={form.discount_type}
                  />
                </div>
              </Section>
            )}

            {/* SEÇÃO 4: Contrato */}
            {!isCert && (
              <Section title="Contrato" hint="Quando ativo, a recorrência para automaticamente no fluxo após o fim do contrato.">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Tem contrato?">
                    <div className="flex items-center h-10">
                      <Switch checked={form.has_contract} onCheckedChange={v => set("has_contract", v)} />
                    </div>
                  </Field>
                  {form.has_contract && (
                    <>
                      <Field label="Duração (meses)" helper="Calcula a data fim a partir do início da recorrência.">
                        <Input
                          type="number"
                          min={1}
                          value={monthsBetween(form.recurrence_start_date, form.contract_end_date) || ""}
                          onChange={e => {
                            const m = Number(e.target.value);
                            const end = computeContractEnd(form.recurrence_start_date, m);
                            set("contract_end_date", end ?? "");
                          }}
                          placeholder="ex: 3"
                        />
                      </Field>
                      <Field label="Fim do contrato" helper="Editável; sobrescreve o cálculo.">
                        <Input type="date" value={form.contract_end_date} onChange={e => set("contract_end_date", e.target.value)} />
                      </Field>
                    </>
                  )}
                </div>
              </Section>
            )}

            {/* SEÇÃO 5: Tráfego (só Marketing) */}
            {isMarketing && (
              <Section title="Tráfego de Anúncios" hint="Recargas + saldo e gasto diário (usado no Calendário de Tráfego).">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Field label="Gasto médio diário (R$)"><Input type="number" step="0.01" value={form.daily_spend} onChange={e => set("daily_spend", e.target.value)} /></Field>
                  <Field label="Saldo atual (R$)"><Input type="number" step="0.01" value={form.traffic_balance} onChange={e => set("traffic_balance", e.target.value)} /></Field>
                  <Field label="Dia de recarga preferido"><Input type="number" min={1} max={31} value={form.traffic_reload_day ?? ""} onChange={e => set("traffic_reload_day", e.target.value)} /></Field>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Histórico de recargas</p>
                  <TrafficRecharges serviceId={editing?.id ?? null} />
                </div>
              </Section>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => handleDialogClose(false)}>Fechar</Button>
            <Button onClick={save}>{editing ? "Salvar alterações" : "Criar serviço"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="border-b pb-1.5">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">{title}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, helper, children }: { label: string; required?: boolean; helper?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {helper && <div className="text-[10px] text-muted-foreground leading-tight">{helper}</div>}
    </div>
  );
}
