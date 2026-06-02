## Objetivo

Permitir adicionar, editar e excluir as categorias de despesas direto na tela **Despesas**, com as categorias atuais como ponto de partida. Renomear ou excluir uma categoria **não** altera despesas já lançadas.

## Banco de dados

Criar tabela `expense_categories` (por usuário, com RLS igual às demais tabelas):
- `name` — nome da categoria
- campos padrão (`id`, `user_id`, `created_at`)
- restrição de nome único por usuário

Na primeira vez que a tela carregar e o usuário não tiver categorias, semear automaticamente a lista atual: Investimento, Infraestrutura, Educação, Despesas Diversas, Software, Equipe, Marketing, Certificado Digital, Outros.

## Tela de Despesas

1. **Carregar categorias** do banco e usar essa lista para preencher o `Select` de categoria (substituindo os itens fixos).
2. **Botão "Gerenciar categorias"** no topo da página, abrindo um modal.
3. **Modal de gerenciamento**:
   - Lista das categorias existentes.
   - Campo + botão para **adicionar** nova categoria.
   - Ícone de **editar** (renomear) em cada item.
   - Ícone de **excluir** em cada item (com confirmação).
   - Excluir/renomear afeta só a lista de categorias; despesas antigas mantêm o texto original.
4. Após qualquer alteração, recarregar a lista de categorias.

## Detalhes técnicos

- Reaproveitar o padrão de RLS `auth.uid() = user_id` das outras tabelas.
- Semear categorias via `insert` no client quando a consulta retornar vazia para o usuário.
- O `Select` de categoria passa a mapear `categories` carregadas em vez de itens hardcoded.
- O modal usa os componentes `Dialog`, `Input`, `Button` já existentes.

Sem alterações no Dashboard (categorias continuam sendo texto livre nas despesas, então o fluxo de caixa não muda).