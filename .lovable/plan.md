## Ajuste: recorrência Anual

Hoje o sistema trata todo `recurrence_value` como mensal, então MRX (R$ 120/ano) está aparecendo como R$ 120 todo mês no fluxo previsto. Precisa respeitar `recurrence_period = "Anual"`.

### Regra

- **Anual**: cobrança única no mês de aniversário do `recurrence_start_date`. Ex.: início 04/2026 → cobra em 04/2026, depois 04/2027, 04/2028…
- **Mensal**: como já é hoje (todo mês a partir do início).

### Onde alterar

1. **`src/pages/Recebimentos.tsx`** (geração das linhas previstas)
   - Para serviços com `recurrence_period === "Anual"`: incluir no mês apenas se `month === startMonth` e `year >= startYear`.
   - Senão (Mensal/null): comportamento atual.

2. **`src/pages/Dashboard.tsx`**
   - `recurringEntries(year, month)`: mesma regra para anuais — só soma quando bate o mês de aniversário.
   - `receiptCalendar`: incluir no calendário do mês só se for o mês de aniversário (quando anual).
   - **MRR (`mrrGross`/`mrrNet`)**: para anuais, somar `recurrence_value / 12` (equivalente mensal), para refletir o ticket recorrente médio sem inflar.
   - `dailyAverage` e `ticket`: passam a usar a versão prorateada via MRR ajustado.

3. **`src/pages/Portfolio.tsx`** (lista de serviços)
   - Continua mostrando `R$ 120/ano` quando `recurrence_period === "Anual"` (já está ok).

### Detalhe técnico

Criar helper em `src/lib/pricing.ts`:

```ts
export function isAnnualDue(period: string|null|undefined, startISO: string|null|undefined, refMonth: Date): boolean {
  if (period !== "Anual") return true; // mensal: sempre vence
  const start = parseLocalDate(startISO);
  if (!start) return false;
  return refMonth.getMonth() === start.getMonth() && refMonth.getFullYear() >= start.getFullYear();
}
export function monthlyEquivalent(value: number, period: string|null|undefined): number {
  return period === "Anual" ? value / 12 : value;
}
```

Aplicar `isAnnualDue` nos loops de Recebimentos e Dashboard antes de somar/criar a linha. Aplicar `monthlyEquivalent` no cálculo de MRR.

### Resultado esperado para MRX

- Abril/2026: previsto R$ 120 (anual, vence agora) — já recebido R$ 120 ✅
- Mai–Mar/2027: R$ 0 de MRX no previsto/realizado.
- Abril/2027: previsto R$ 120 novamente.
- MRR conta MRX como R$ 10/mês (120/12).
