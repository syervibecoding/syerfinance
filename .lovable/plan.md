## Problema

O registro de Certificado Digital de abril/2026 (R$ 300, CM Contábil) **já está sendo somado** ao fluxo de caixa do Dashboard — o tooltip de abril mostra R$ 5.920 (que inclui os R$ 300). Porém, do ponto de vista do usuário, ele "não vê" porque:

1. No **gráfico de Fluxo Mensal**, o valor entra somado às outras entradas, sem distinção visual.
2. No **Calendário de Recebimentos** lateral, o registro só aparece quando o mês selecionado no Dashboard é exatamente abril/2026. Hoje (maio/2026) o calendário lateral não mostra abril, então parece que "sumiu".
3. Não existe nenhum KPI ou indicador dedicado mostrando o total faturado em Certificados Digitais.

## Solução

### 1. Card KPI dedicado "Certificados Digitais (mês)"
Adicionar na linha de mini-KPIs do Dashboard um novo card mostrando:
- Valor faturado em Certificados Digitais no mês selecionado
- Quantidade de certificados emitidos no mês
- Hint: "CM Contábil — N registros"

### 2. Destaque no Calendário de Recebimentos
- Manter a lógica atual (registros do mês selecionado aparecem na lista lateral).
- Adicionar um **badge visual** no item para diferenciar de recorrências mensais.
- Quando o mês selecionado **não tem** registro mas existe registro nos meses anteriores/seguintes, mostrar um aviso suave: "Próximo certificado: abr/26 — R$ 300".

### 3. Diferenciar no gráfico de Fluxo Mensal
Adicionar uma terceira barra/linha (ou tooltip detalhado) que destaque "Certif. Digital" como item separado dentro de "entradas". Implementação: separar `cashflowData` em `entradas`, `saidas`, e `certificados` (subcomponente das entradas) — exibido como barra empilhada ou via tooltip que detalha a composição.

### 4. Garantir visibilidade independente do mês
Adicionar abaixo dos KPIs uma faixa horizontal compacta listando **todos os meses com Certificado Digital cadastrado** (chips clicáveis) — clicar muda o `monthRef` para aquele mês. Assim o usuário enxerga rapidamente todo o histórico, mesmo sem navegar mês a mês.

## Arquivos afetados

- `src/pages/Dashboard.tsx` — adicionar KPI, chips de meses, ajustar gráfico e calendário.

## Detalhes técnicos

- Filtro base: `services.filter(s => s.category === "Certificado Digital" && s.recurrence_start_date)`
- Métricas do mês: somar `value` e `recurrence_value` (quantidade) onde a data bate com `monthRef`.
- Chips de histórico: agrupar por `YYYY-MM` ordenado desc, mostrar até 12 mais recentes.
- Gráfico empilhado: usar `<Bar dataKey="entradasBase" stackId="in" />` + `<Bar dataKey="certificados" stackId="in" />` mantendo soma total visualmente igual.

Não há mudanças de banco — toda integração já existe.