import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { brl, fmtDate } from "@/lib/format";
import { AlertTriangle, Send, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Forecast {
  service: any;
  daysLeft: number;
  empties: Date;
  status: "ok" | "soon" | "today" | "overdue";
}

export default function TrafficCalendar() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("services").select("*").eq("category", "Marketing");
      setServices(data ?? []);
    })();
  }, []);

  const forecasts: Forecast[] = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return services
      .filter(s => Number(s.daily_spend) > 0)
      .map(s => {
        const balance = Number(s.traffic_balance ?? 0);
        const daily = Number(s.daily_spend);
        const lastDate = s.last_recharge_date ? new Date(s.last_recharge_date) : today;
        const daysSince = Math.max(0, Math.floor((today.getTime() - lastDate.getTime()) / 86400000));
        const remaining = Math.max(0, balance - daysSince * daily);
        const daysLeft = Math.floor(remaining / daily);
        const empties = new Date(today); empties.setDate(empties.getDate() + daysLeft);
        let status: Forecast["status"] = "ok";
        if (daysLeft < 0 || remaining === 0) status = "overdue";
        else if (daysLeft === 0) status = "today";
        else if (daysLeft <= 3) status = "soon";
        return { service: s, daysLeft, empties, status };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [services]);

  const urgent = forecasts.filter(f => f.status === "today" || f.status === "overdue");
  const soon = forecasts.filter(f => f.status === "soon");
  const ok = forecasts.filter(f => f.status === "ok");

  return (
    <div>
      <PageHeader title="Calendário de Tráfego" subtitle="Previsão de esgotamento de saldo de anúncios por cliente" />

      {forecasts.length === 0 ? (
        <EmptyState message="Cadastre serviços de Marketing com saldo e gasto diário para visualizar previsões." />
      ) : (
        <div className="space-y-6">
          {urgent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Enviar PIX agora ({urgent.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {urgent.map(f => <ForecastCard key={f.service.id} f={f} />)}
              </div>
            </section>
          )}

          {soon.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-warning mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Próximos 3 dias ({soon.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {soon.map(f => <ForecastCard key={f.service.id} f={f} />)}
              </div>
            </section>
          )}

          {ok.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Saudáveis ({ok.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ok.map(f => <ForecastCard key={f.service.id} f={f} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ForecastCard({ f }: { f: Forecast }) {
  const tone = {
    overdue: "border-destructive/40 bg-danger-soft",
    today: "border-destructive/40 bg-danger-soft",
    soon: "border-warning/40 bg-warning-soft",
    ok: "bg-card",
  }[f.status];

  const badge = {
    overdue: <Badge variant="destructive">Saldo zerado</Badge>,
    today: <Badge variant="destructive" className="gap-1"><Send className="h-3 w-3" />Enviar PIX hoje</Badge>,
    soon: <Badge className="bg-warning text-warning-foreground hover:bg-warning">Em {f.daysLeft}d</Badge>,
    ok: <Badge variant="outline">Em {f.daysLeft}d</Badge>,
  }[f.status];

  return (
    <Card className={cn("transition-colors", tone)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{f.service.client}</CardTitle>
            <p className="text-xs text-muted-foreground">{f.service.service_name}</p>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        <Row label="Última recarga" value={`${brl(f.service.last_recharge_value)} · ${fmtDate(f.service.last_recharge_date)}`} />
        <Row label="Gasto diário" value={brl(f.service.daily_spend)} />
        <Row label="Esgota em" value={fmtDate(f.empties.toISOString())} bold />
      </CardContent>
    </Card>
  );
}
function Row({ label, value, bold }: any) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{label}</span><span className={cn("tabular-nums", bold && "font-semibold")}>{value}</span></div>;
}
