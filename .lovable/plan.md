## Problema

Na listagem de Projetos (ServicesByCategory), a coluna "Implementação" do cliente Use Noronha mostra `R$ 1.800,00 / R$ 2.000,00` com barra ~90%, ignorando o desconto de 10% (Pix). O componente do dialog já foi corrigido, mas a tabela e o total agregado ainda usam `implementation_charged` bruto.

## Correção em `src/pages/ServicesByCategory.tsx`

1. **Linha da tabela (≈167-184)** — calcular o cobrado efetivo aplicando o desconto:
   ```ts
   const pctDisc = Number(it.discount_percentage ?? 0);
   const effectiveCharged = pctDisc > 0 ? charged * (1 - pctDisc/100) : charged;
   const pct = effectiveCharged > 0 ? Math.min(100, (paid / effectiveCharged) * 100) : 0;
   ```
   Exibir `{brl(paid)} / {brl(effectiveCharged)}`. Manter o `charged` bruto apenas como tooltip opcional (ex.: title no span) para referência — sem poluir o layout.

2. **`totalImpl` (linha 134)** — somar `effectiveCharged` em vez de `implementation_charged` bruto, para o total agregado refletir os descontos.

3. **Dashboard** — já está correto (`balanceDue` aplica desconto). Nada a alterar lá.

Nenhuma mudança de schema. Apenas alinhar a UI da listagem com a regra de desconto já adotada no dialog e no Dashboard.

## Resultado esperado

Linha do Use Noronha: `R$ 1.800,00 / R$ 1.800,00`, barra 100%. Total de implementação no topo refletindo o líquido com desconto.