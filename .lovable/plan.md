# Plano: Recebimentos mensais e reajuste de ticket

## 1. Nova aba "Recebimentos" (grupo Financeiro)

Página `/recebimentos` lista, mês a mês, todas as cobranças que deveriam entrar — vindas de:
- `services` recorrentes (marketing, sites, plataformas)
- `maintenance_contracts`
- `companies` (sociedades)
- `implementation_payments` agendados
- Certificado Digital (registros do mês)

Cada linha tem: cliente, origem, valor previsto, status (Pago / Parcial / Pendente / Atrasado / Não pago), valor recebido, data do pagamento, observação.

Filtros: mês de referência, status, cliente, categoria. Totais no topo: Previsto, Recebido, Em aberto, Inadimplência (%).

Ações: marcar como pago (preenche data = hoje e valor = previsto), pagamento parcial (abre modal com valor recebido), marcar como não pago, editar, desfazer.

## 2. Impacto no Dashboard (previsto vs realizado)

- Gráfico de fluxo de caixa passa a ter **duas séries de entrada**: "Previsto" (linha tracejada/clara) e "Realizado" (barra sólida).
- Totalizador mensal ganha 3 pílulas de entrada: **Previsto**, **Recebido**, **Em aberto** (com cor de alerta se houver inadimplência).
- Saídas continuam como hoje.
- Calendário de recebimentos passa a mostrar bolinha verde (pago), amarela (pendente) e vermelha (atrasado).
- Override histórico (ex.: março/26 = R$ 6.120) continua funcionando como teto do "Realizado".

## 3. Reajuste de ticket sem alterar o passado

No formulário de Serviço, Contrato e Sociedade, adicionar bloco **"Reajuste"**:
- Campo `next_value` (novo valor)
- Campo `next_value_start` (mês/ano em que passa a valer)

Comportamento:
- Até o mês anterior à vigência → usa `value`/`recurrence_value`/`monthly_value` atual.
- A partir do mês de vigência → usa `next_value`.
- Quando a data de vigência chegar (ou no próximo "salvar"), o sistema promove automaticamente: `value = next_value` e limpa os campos `next_*`. Sem perder o histórico do que já foi pago, porque os valores recebidos ficam gravados em `payment_records` (item 4).

## 4. Mudanças no banco

Tabela nova `payment_records`:
- `source_type` (service | contract | company | implementation | certificate)
- `source_id` (uuid da origem)
- `client`, `reference_month` (date, dia 1)
- `expected_value`, `received_value`
- `status` (paid | partial | pending | overdue | unpaid)
- `paid_date`, `notes`, `user_id`, timestamps
- RLS por `user_id`
- Índice em (`user_id`, `reference_month`)

Colunas novas (3 ALTER TABLE):
- `services`: `next_recurrence_value numeric`, `next_value_start date`
- `maintenance_contracts`: `next_monthly_value numeric`, `next_value_start date`
- `companies`: `next_payment_value numeric`, `next_value_start date`

Os `payment_records` são gerados sob demanda: ao abrir a aba de um mês, o backend (ou o front) faz upsert das linhas previstas que ainda não existem para aquele mês, com `status = pending` e `expected_value` calculado pelo valor vigente (considerando reajuste). Ao marcar como pago, atualiza a linha existente.

## 5. Arquivos afetados

- `supabase/migrations/...` — nova tabela + 3 ALTER + RLS
- `src/pages/Recebimentos.tsx` (novo)
- `src/App.tsx` — rota `/recebimentos`
- `src/components/AppLayout.tsx` — item no grupo Financeiro
- `src/pages/Dashboard.tsx` — séries previsto/realizado, pílulas, calendário colorido
- `src/pages/ServicesByCategory.tsx` — bloco Reajuste
- `src/pages/Maintenance.tsx` — bloco Reajuste
- (tela de Empresas/Sociedades onde estiver) — bloco Reajuste

## 6. Detalhes técnicos

- `reference_month` sempre normalizado para o dia 1 do mês para facilitar agregações.
- Função utilitária `getActiveValue(source, month)` centraliza a lógica de "valor vigente considerando reajuste".
- "Promoção" do reajuste: ao carregar serviço/contrato/sociedade, se `next_value_start <= today`, aplica e zera os campos `next_*` no banco (idempotente).
- Inadimplência no Dashboard = `sum(expected) - sum(received)` apenas para meses ≤ atual.
