## Problema

No formulário de serviço, o bloco "Pagamentos da implementação" mostra:
- `R$ 1.800,00 / R$ 2.000,00 · Saldo R$ 200,00`
- barra de progresso em ~90%

Mesmo com 10% de desconto no Pix (valor efetivo R$ 1.800) e pagamento de R$ 1.800, o componente ignora o desconto e considera que ainda faltam R$ 200. Isso é inconsistente com a correção já aplicada no Dashboard (que passou a aplicar o desconto na "Dívida de Implementação").

## Correção

Tornar o componente `ImplementationPayments` ciente do desconto:

1. **`src/components/ImplementationPayments.tsx`**
   - Adicionar nas props: `discountPercentage?: number | string | null` e `discountType?: string | null` (ex: "Pix", "à vista").
   - Calcular `effectiveCharged = charged * (1 - pct/100)` quando houver `%` > 0.
   - Usar `effectiveCharged` no lugar de `charged` para:
     - `pct` (progresso)
     - `remaining` (saldo)
     - label `{brl(total)} / {brl(effectiveCharged)} · Saldo {brl(remaining)}`
   - Se houver desconto, mostrar uma linha discreta abaixo: `Valor cobrado R$ 2.000,00 · Desconto 10% (Pix) → R$ 1.800,00`.
   - Manter `charged` original apenas como referência visual; não alterar nada no banco.

2. **`src/pages/ServicesByCategory.tsx`** (onde o componente é usado dentro do dialog do serviço)
   - Passar `discountPercentage` e `discountType` do estado do formulário para o `<ImplementationPayments />`.

Nenhuma alteração de schema ou de lógica do Dashboard — apenas alinhar o widget com a regra de desconto já adotada no resto do app.

## Resultado esperado

No exemplo do print (cobrado 2000, 10% Pix, pago 1800):
- Progresso: 100%
- Saldo: R$ 0,00
- Label: `R$ 1.800,00 / R$ 1.800,00 · Saldo R$ 0,00`
- Linha auxiliar: `Cobrado R$ 2.000,00 · 10% Pix → R$ 1.800,00`
