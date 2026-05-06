## Melhorias do Dashboard, Sidebar e Formulário de Serviços

### 1) Sidebar — categorias colapsáveis (e mover Sociedades)

Hoje os grupos (`VISÃO GERAL`, `SERVIÇOS`, `OPERAÇÕES`, `FINANCEIRO`) só são rótulos. Vou transformar cada grupo em uma seção **colapsável** (expand/recolher) usando o componente `Collapsible` (já presente em `src/components/ui/collapsible.tsx`).

Comportamento:
- Cabeçalho do grupo vira clicável, com seta `ChevronDown`/`ChevronRight` à direita.
- Estado por grupo persistido em `localStorage` (chave `sidebar:groups:open` → objeto `{ "Serviços": true, ... }`).
- Por padrão, o grupo que contém a rota ativa fica **aberto**; os demais respeitam o último estado salvo (default: todos abertos na primeira visita).
- Quando a sidebar inteira está colapsada (modo ícones, 64px), os grupos não mostram cabeçalho clicável — apenas o separador atual + ícones (igual hoje).

**Reorganização dos grupos** (ponto 2 do pedido):
- Mover **Empresas & Sociedades** de `OPERAÇÕES` para `FINANCEIRO`, já que representa receita de participação societária.
- `OPERAÇÕES` fica com: Calendário de Tráfego, Quadro de Atividades.
- `FINANCEIRO` fica com: Empresas & Sociedades, Despesas & Custos.

Arquivo: `src/components/AppLayout.tsx`.

---

### 2) Dashboard — totalizador mensal de Entradas e Saídas

Acima do gráfico "Fluxo Mensal de Entradas e Saídas" (ou no header do `Card`), adicionar três blocos compactos referentes ao **mês selecionado** (`monthRef`):

- **Entradas do mês** — soma de `entradas` (recorrências de serviços + contratos + sociedades + cert. digital + pagamentos de implementação + entradas históricas) do mês atual, em verde.
- **Saídas do mês** — soma de `saidas` do mês atual, em vermelho/warning.
- **Saldo do mês** — `entradas - saidas`, com cor dinâmica (verde se ≥0, vermelho se <0).

Implementação: derivar do `cashflowData` filtrando o item cujo `month` corresponde ao `monthRef` (precisa expor `key`/`year`/`month` no item, ou recalcular pelas mesmas regras). Layout: três pílulas pequenas no topo do card do gráfico, alinhadas à direita junto da legenda existente — ou um mini-grid de 3 colunas acima do gráfico.

Arquivo: `src/pages/Dashboard.tsx`.

---

### 3) Formulário "Novo serviço" — reduzir confusão

Diagnóstico do form atual (em `ServicesByCategory.tsx`):

- Tem ~18 campos misturados em um único grid 2-colunas (cobrado, implementação, recorrência, período, início, dia pagamento, split, 2º dia, prazo, tráfego×5, contrato×2…).
- Campos opcionais ficam sempre visíveis (split de pagamento, contrato, tráfego só aparecem na categoria Marketing).
- **Não fica claro o que é obrigatório** para a plataforma "entender" o serviço (o cálculo de fluxo de caixa exige `recurrence_value` + `recurrence_start_date` + `payment_day`, mas nada sinaliza isso).
- Campo "Valor cobrado" e "Implementação cobrada" geram dúvida: qual é qual? Se já cobra implementação à parte, o "valor" duplica?
- Botão "Salvar" é genérico — após salvar pela primeira vez o dialog continua aberto para registrar pagamentos, sem feedback visual claro.

**Melhorias propostas:**

a) **Reorganizar em seções com títulos** (cabeçalhos pequenos uppercase, igual já existe no bloco de Tráfego):
```
[1] IDENTIFICAÇÃO        Cliente · Nome do serviço · Status · Categoria
[2] COBRANÇA RECORRENTE  Valor mensal · Período · Início · Dia pagto · Split (toggle → revela 2º dia)
[3] IMPLEMENTAÇÃO        Valor cobrado · (lista de pagamentos)
[4] CONTRATO             Tem contrato? (toggle → revela Fim do contrato)
[5] TRÁFEGO (só Marketing)
```

b) **Marcar campos obrigatórios** com asterisco e validar no submit (Cliente, Nome, Categoria; e se houver recorrência: período + dia + início).

c) **Remover o campo "Valor cobrado" duplicado**: deixar só "Valor da recorrência" + "Implementação cobrada". O campo `value` continua salvando (compat), mas é preenchido automaticamente = `recurrence_value` para evitar a dupla entrada confusa. (Ele só é exibido para a categoria *Certificado Digital*, onde representa o valor pontual do mês.)

d) **Esconder campos opcionais por trás de toggles**: "Pagamento dividido" só aparece "2º dia" se ligado (já tem disabled, vou ocultar de fato); "Tem contrato" só aparece "Fim do contrato" se ligado.

e) **Mensagens de ajuda (helper text)** pequenas embaixo dos campos críticos: "Início da recorrência define a partir de qual mês entra no fluxo de caixa", "Dia de pagamento aparece no Calendário de Recebimentos".

f) **Após salvar pela 1ª vez**: trocar o título do dialog para "Editar — registre os pagamentos da implementação" e destacar a seção de pagamentos (borda accent), deixando claro que o serviço já foi criado.

g) **Botão Salvar** com label dinâmico: "Criar serviço" (novo) / "Salvar alterações" (editando).

Arquivo: `src/pages/ServicesByCategory.tsx`.

---

### Detalhes técnicos (para referência)

- Sidebar: usar `Collapsible` do Radix com `open`/`onOpenChange` controlado por estado; estado num objeto `Record<string, boolean>` salvo em `localStorage`.
- Dashboard: criar `monthTotals` via `useMemo` a partir de `cashflowData[idx do mês atual]`.
- Form: criar pequenos sub-componentes `Section({title, children})` para reduzir verbosidade do JSX. Validação simples com `if (!form.client || !form.service_name) toast erro`.

### Arquivos a alterar
- `src/components/AppLayout.tsx` — grupos colapsáveis + mover Sociedades para Financeiro
- `src/pages/Dashboard.tsx` — totalizadores Entradas/Saídas/Saldo do mês
- `src/pages/ServicesByCategory.tsx` — reorganização em seções, validação, helper text, toggles condicionais, botão dinâmico
