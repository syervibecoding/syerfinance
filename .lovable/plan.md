## Objetivo

Dois ajustes nos serviços (abas Marketing/Sites/Plataformas):

1. **Encerrar cliente com data** — ao inativar um serviço, pedir a data do último pagamento. A receita conta normalmente até o mês desse pagamento e zera a partir do mês seguinte (no Dashboard, projeções e calendário).
2. **Valor vigente na aba do cliente** — a coluna "Recorrência" e o MRR passam a mostrar o valor em vigor hoje (ex.: BrinkMais R$600 já a partir de junho), e não o valor base cadastrado (R$1200).

## Por que o BrinkMais não mudou

Você cadastrou o novo valor (R$600 a partir de 05/06/2026) no campo "Reajuste futuro". O Dashboard já calcula R$600 de junho em diante, mas a aba do cliente exibe o campo "valor base" cru (R$1200), por isso parecia que nada mudou. Vamos fazer a aba refletir o valor vigente.

## Banco de dados

- Adicionar a coluna `end_date` (data) na tabela `services` para guardar a data do último pagamento quando o cliente é encerrado.

## Aba do cliente (ServicesByCategory.tsx)

- Adicionar o status **"Encerrado"** à lista de status.
- No formulário, quando o status for "Encerrado", exibir um campo de data **"Data do último pagamento"** (gravado em `end_date`).
- Na tabela, a coluna **Recorrência** passa a mostrar o **valor vigente** no mês atual (usa `activeValue`), refletindo reajustes já em vigor.
- O **MRR** do topo passa a somar o valor vigente e a **ignorar serviços encerrados** cujo último pagamento já passou. Serviços encerrados aparecem com o badge "Encerrado".

## Dashboard (Dashboard.tsx)

Aplicar o corte por encerramento em todos os pontos onde a receita recorrente do serviço é considerada, contando até o mês do último pagamento e zerando depois:

- Filtro `recurringServices` (métricas/MRR).
- Cálculo mensal `cashflowData` (projeções dos 12 meses).
- Lista do `receiptCalendar` (calendário de recebimentos), que também passa a usar o valor vigente em vez do valor base.

## Detalhe técnico (pricing.ts)

- Criar um helper `isServiceActive(svc, refMonth)` que retorna `false` quando há `end_date` e o mês de referência é posterior ao mês do último pagamento (reaproveita a lógica de comparação por chave de mês já usada em `isContractActive`). Usar esse helper nos pontos do Dashboard acima, em conjunto com o `isContractActive` existente.

Nada do passado é alterado: meses até o último pagamento permanecem com o valor normal.