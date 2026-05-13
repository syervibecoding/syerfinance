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
