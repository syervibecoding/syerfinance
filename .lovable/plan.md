## Objetivo

Na categoria **Publicidade (Marketing)**:
1. Adicionar a seção de **Implementação (cobrança única)** — idêntica à de Sites/Plataformas (valor cobrado, % de desconto, condição do desconto e registro de pagamentos parciais).
2. **Remover** do formulário do cliente a seção **"Tráfego de Anúncios"** (gasto diário, saldo, dia de recarga e histórico de recargas).
3. Manter a página **Calendário de Tráfego** como está.

## Alterações em `src/pages/ServicesByCategory.tsx`

1. **Seção de cobrança única (linha ≈328)** — incluir `"Marketing"` na condição que hoje só libera para `Plataformas` e `Sites`:
   ```ts
   {(category === "Plataformas" || category === "Sites" || category === "Marketing") && ( ... )}
   ```
   Nada mais muda nessa seção: já tem valor cobrado, desconto, valor com desconto e `<ImplementationPayments />` para pagamentos parciais.

2. **Remover a Seção 5 "Tráfego de Anúncios" (linhas ≈393-406)** — apaga o bloco `{isMarketing && ( <Section title="Tráfego de Anúncios"> ... </Section> )}`, que contém os campos de gasto diário, saldo, dia de recarga e o componente `<TrafficRecharges />`.

3. **Import** — remover o import não utilizado de `TrafficRecharges` (linha 16).

## Pontos de atenção

- A **coluna "Saldo / Diário"** da tabela e a página **Calendário de Tráfego** continuam funcionando com os dados já existentes; apenas deixa de existir a entrada/edição desses dados pelo formulário do cliente (conforme solicitado).
- A cobrança única já é integrada ao Dashboard via `implementation_payments` (mesma lógica de Sites/Plataformas), então o fluxo de caixa segue refletindo os valores.
- Sem mudanças de schema.

## Resultado esperado

- Ao abrir um serviço de Publicidade, aparece a seção "Implementação (cobrança única)" com valor, desconto e pagamentos.
- O formulário do cliente não exibe mais nada de recarga/tráfego.
