## Ajustes na plataforma

### 1. Remover "+ Novo Job" do Dashboard
- Em `src/pages/Dashboard.tsx` (linha 257), remover a prop `onAdd`/`addLabel` do `PageHeader` para o botão sumir. Cada aba já tem seu próprio "Novo serviço".

### 2. Implementação condicional (Projetos & Plataformas + Sites)
- Em `src/pages/ServicesByCategory.tsx`, a Seção 3 ("Implementação") hoje aparece para todas categorias exceto Cert. Digital.
- Mudar a condição para `category === "Plataformas" || category === "Sites"`.
- Marketing perde os campos `implementation_charged`, `discount_percentage`, `discount_type` e o componente `ImplementationPayments`.

### 3. Recarga de tráfego com lista/histórico dentro de Marketing
- Hoje só existem 4 campos soltos (última recarga, data, gasto diário, saldo) na Seção "Tráfego de Anúncios" e a página `/trafego` mostra a previsão.
- Plano: criar tabela nova `traffic_recharges` (id, user_id, service_id, value, recharge_date, notes, timestamps + RLS por user_id).
- No formulário do serviço Marketing, substituir o input único "Última recarga" por um mini-histórico:
  - Lista das últimas recargas do serviço (data + valor + nota), ordenado desc.
  - Botão "+ Nova recarga" abre uma linha inline (valor + data + nota) que insere em `traffic_recharges` e atualiza `last_recharge_value`/`last_recharge_date` no service.
- Na tela `/marketing` (lista de serviços), adicionar abaixo da tabela uma seção "Histórico de recargas" agregando todas as recargas dos serviços de marketing (cliente, serviço, data, valor), com filtro por cliente.
- O cálculo do `TrafficCalendar` continua usando `last_recharge_*` no service — sem mudança comportamental.

### 4. Banner de alerta de cobrança anual no Dashboard
- No `Dashboard.tsx`, calcular `anuaisDoMes`: serviços com `recurrence_period === "Anual"` cujo mês de `recurrence_start_date` == mês corrente exibido.
- Renderizar um banner (`Card` com tom warning, ícone Bell) no topo do Dashboard quando `anuaisDoMes.length > 0`:
  - Texto: "Cobrança anual neste mês: MRX (R$ 120) — vence dia X". Lista cada cliente com valor e dia de pagamento.
- O banner respeita o mês selecionado (`monthRef`). MRR continua somando 120/12 = 10 (já implementado no commit anterior).

### Arquivos afetados
- `src/pages/Dashboard.tsx` — remover botão + adicionar banner anual
- `src/pages/ServicesByCategory.tsx` — condição da Implementação + UI de recargas
- `src/pages/TrafficCalendar.tsx` — sem mudanças funcionais (continua lendo do service)
- `src/components/TrafficRecharges.tsx` (novo) — mini-histórico dentro do form e seção agregada na lista Marketing
- `supabase/migrations/...` — nova tabela `traffic_recharges` + RLS

### Detalhe técnico
- A nova tabela só armazena o histórico — o cálculo do calendário de tráfego continua usando os campos `last_recharge_*` do service (atualizados ao inserir uma nova recarga), evitando refazer a lógica de previsão.
- O banner anual usa `isPeriodDue` já existente em `src/lib/pricing.ts`.
