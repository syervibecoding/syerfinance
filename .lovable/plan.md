## Pagamentos parciais de implementação

Hoje cada serviço tem só dois campos: `implementation_charged` (total cobrado) e `implementation_paid` (um valor único). Isso não permite registrar quando o cliente paga em parcelas em datas diferentes (ex: 50% hoje, 50% daqui 15 dias).

A proposta é criar uma tabela de **pagamentos de implementação** ligada ao serviço, e mostrar o histórico + saldo na tela de Sites e Plataformas (e Marketing também, para manter consistência).

### O que muda

**1. Banco de dados**

Nova tabela `implementation_payments`:
- `id`, `user_id`, `service_id` (referência ao serviço)
- `value` (valor pago naquela data)
- `paid_date` (data do pagamento)
- `notes` (observação opcional, ex: "PIX", "1ª parcela")
- `created_at`, `updated_at`
- RLS por `user_id` (mesmo padrão das outras tabelas)

O campo antigo `implementation_paid` na tabela `services` continua existindo, mas passa a ser **calculado automaticamente** = soma dos pagamentos da nova tabela. Para o registro existente do MRX (R$ 500 já pago), faço uma migração de dados criando 1 pagamento histórico.

**2. Interface — página de Sites / Plataformas / Marketing**

Dentro do diálogo de editar serviço, abaixo do campo "Implementação cobrada", aparece uma seção **"Pagamentos recebidos"** com:

```text
Implementação cobrada:  R$ 1.000,00
Total recebido:         R$ 500,00  (50%)
Saldo a receber:        R$ 500,00

Histórico:
  03/04/2026  R$ 300,00   1ª parcela        [editar] [excluir]
  18/04/2026  R$ 200,00   PIX restante      [editar] [excluir]

[+ Registrar pagamento]
```

O botão **"+ Registrar pagamento"** abre um mini-form (data, valor, observação) e adiciona à lista. Atualiza o total na hora.

Na **tabela principal** (lista de serviços), a coluna "Implementação" passa a mostrar:
```text
R$ 500 / R$ 1.000   (50%)
```
com uma barra de progresso fina abaixo, para ver de relance quem ainda deve.

**3. Dashboard**

O cálculo de "implementações recebidas" do mês passa a usar `paid_date` dos pagamentos (data real de entrada do dinheiro), não mais um campo único sem data. Isso deixa o fluxo de caixa mais preciso.

### Detalhes técnicos

- Migration cria `implementation_payments` com RLS (`auth.uid() = user_id`) e trigger `set_updated_at`.
- Migração de dados: para cada serviço com `implementation_paid > 0`, inserir 1 linha em `implementation_payments` com `paid_date = created_at::date` e `notes = 'Pagamento histórico'`.
- `implementation_paid` em `services` deixa de ser editável manualmente; passa a ser derivado via `SELECT COALESCE(SUM(value),0) FROM implementation_payments WHERE service_id = ?`. A UI carrega esse total junto com o serviço.
- Componente novo `ImplementationPayments.tsx` reutilizável dentro do diálogo de `ServicesByCategory.tsx`.
- Dashboard (`Dashboard.tsx`) lê de `implementation_payments` filtrado pelo mês selecionado para o card de "implementações recebidas".

### Fora do escopo

- Não estou tocando em recorrências mensais (essas seguem o `payment_day` e `recurrence_value` como hoje).
- Não estou criando lembretes/cobranças automáticas — apenas registro manual.