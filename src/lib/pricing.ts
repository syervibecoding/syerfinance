// Utilitários para "valor vigente" com reajuste futuro.
// Mantém o passado intacto: até o mês anterior à vigência usa o valor atual,
// a partir do mês de vigência usa next_value.

export function parseLocalDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const iso = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Retorna o valor vigente em refMonth (date qualquer dentro do mês). */
export function activeValue(
  current: number | string | null | undefined,
  nextValue: number | string | null | undefined,
  nextStart: string | null | undefined,
  refMonth: Date,
): number {
  const cur = Number(current ?? 0);
  if (nextValue == null || nextValue === "" || !nextStart) return cur;
  const start = parseLocalDate(nextStart);
  if (!start) return cur;
  const startKey = start.getFullYear() * 12 + start.getMonth();
  const refKey = refMonth.getFullYear() * 12 + refMonth.getMonth();
  return refKey >= startKey ? Number(nextValue) : cur;
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Para recorrência "Anual", só vence no mês de aniversário do start. Mensal vence sempre. */
export function isPeriodDue(
  period: string | null | undefined,
  startISO: string | null | undefined,
  refMonth: Date,
): boolean {
  if (period !== "Anual") return true;
  const start = parseLocalDate(startISO);
  if (!start) return false;
  if (refMonth.getFullYear() < start.getFullYear()) return false;
  if (refMonth.getFullYear() === start.getFullYear() && refMonth.getMonth() < start.getMonth()) return false;
  return refMonth.getMonth() === start.getMonth();
}

/** Equivalente mensal para MRR (anual = valor / 12). */
export function monthlyEquivalent(value: number | string | null | undefined, period: string | null | undefined): number {
  const v = Number(value ?? 0);
  return period === "Anual" ? v / 12 : v;
}

/** Retorna true se o serviço/contrato está vigente no mês de referência.
 * Sem contrato (has_contract=false) → sempre ativo.
 * Com contrato mas sem data fim → ativo (não bloqueia).
 * Com data fim → ativo até o mês (inclusive) da data fim. */
export function isContractActive(
  svc: { has_contract?: boolean | null; contract_end_date?: string | null } | null | undefined,
  refMonth: Date,
): boolean {
  if (!svc?.has_contract) return true;
  const end = parseLocalDate(svc.contract_end_date);
  if (!end) return true;
  const endKey = end.getFullYear() * 12 + end.getMonth();
  const refKey = refMonth.getFullYear() * 12 + refMonth.getMonth();
  return refKey <= endKey;
}

/** Calcula a data fim do contrato dada start + duração em meses (último dia do enésimo mês). */
export function computeContractEnd(startISO: string | null | undefined, months: number): string | null {
  const start = parseLocalDate(startISO);
  if (!start || !months || months <= 0) return null;
  // último dia do mês (start.month + months - 1)
  const end = new Date(start.getFullYear(), start.getMonth() + months, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
}

/** Calcula duração (meses) entre start e end (inclusive). */
export function monthsBetween(startISO: string | null | undefined, endISO: string | null | undefined): number {
  const s = parseLocalDate(startISO);
  const e = parseLocalDate(endISO);
  if (!s || !e) return 0;
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
}
