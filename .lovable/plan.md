## Objetivo

1. Permitir classificar despesas em categorias mais úteis: **Investimento, Infraestrutura, Educação, Despesas Diversas** (mantendo as atuais já usadas).
2. Mostrar no **Dashboard** uma nova seção com a **divisão de despesas por categoria** (gráfico + lista) do mês selecionado.
3. Tratar **Investimento** como item separado: ele não reduz o saldo operacional do mês, aparecendo destacado.

## 1. Cadastro de despesas — `src/pages/Expenses.tsx`

No `Select` de Categoria (≈linha 187-194), acrescentar as novas opções, mantendo as existentes:
- Adicionar: `Investimento`, `Educação`, `Despesas Diversas`.
- Manter: `Software`, `Equipe`, `Marketing`, `Infraestrutura`, `Certificado Digital`, `Outros`.

Nenhuma mudança de schema — a coluna `category` (texto livre) já suporta os novos valores.

## 2. Dashboard — `src/pages/Dashboard.tsx`

### a) Separar Investimento do fluxo operacional
- Em `metrics` (≈linha 75-80): calcular `totalExpenses` **excluindo** despesas de categoria `Investimento`, e somar um novo `totalInvestment` (só `Investimento` do mês). `mrrNet` passa a usar o `totalExpenses` operacional.
- Em `cashflowData` (≈linha 182-184): o cálculo de `saidas` passa a **ignorar** despesas `Investimento`, para o saldo do gráfico refletir só o operacional.

### b) Novo cálculo de divisão por categoria
- Criar um `useMemo` `expenseBreakdown` que agrupa as despesas do mês selecionado por `category`, somando os valores, ordenado do maior para o menor. Separar visualmente o bloco de `Investimento`.

### c) Nova seção visual (gráfico + lista)
Adicionar um bloco novo (entre a Linha 2 de mini-KPIs e a Linha 3 do fluxo) com:
- **Gráfico de pizza** (`PieChart`/`Pie`/`Cell` do recharts) com a proporção de cada categoria operacional no mês.
- **Lista** ao lado com total por categoria (`brl`) e % do total, usando o padrão de cartões/linhas existente.
- Um destaque separado para **Investimento** (valor do mês), deixando claro que está fora do operacional.

Cores via tokens do design system (`hsl(var(--...))`), sem cores fixas.

## Pontos de atenção

- Mantém toda a lógica atual de fluxo de caixa, recebimentos e certificados intacta; só muda o tratamento de `Investimento` nas saídas.
- A despesa de "terreno" deve ser reclassificada manualmente para `Investimento`, "IFL Recife" para `Educação` etc. — a tela passa a oferecer essas opções (a reclassificação dos registros antigos é feita pelo usuário editando cada despesa).
- Conforme regra do projeto, a integração com o Dashboard fica validada: toda despesa continua refletida no fluxo (operacional ou como investimento destacado).

## Resultado esperado

- No cadastro de despesas aparecem as categorias Investimento, Infraestrutura, Educação e Despesas Diversas.
- No Dashboard há uma seção com gráfico + lista mostrando quanto foi gasto por categoria no mês, com Investimento separado e sem distorcer o saldo operacional.
