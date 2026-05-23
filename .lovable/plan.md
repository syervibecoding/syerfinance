## Contrato com duração em meses + corte da recorrência

### Problema
O campo "Fim do contrato" hoje só guarda a data, mas Dashboard e Recebimentos ignoram esse limite — a recorrência aparece infinitamente. Além disso digitar "3 meses a partir de julho" é desconfortável.

### Mudanças

**1. Formulário (`src/pages/ServicesByCategory.tsx` — Seção Contrato)**

Quando "Tem contrato?" estiver ligado, mostrar dois campos lado a lado:
- **Duração (meses)** — input numérico. Ao mudar, calcula automaticamente `contract_end_date = recurrence_start_date + N meses - 1 dia` (último dia do enésimo mês).
- **Fim do contrato** — input date editável (preenchido pelo cálculo, mas o usuário pode sobrescrever).

Se o usuário mudar o `recurrence_start_date` ou a duração, recalcula a data fim.

Helper: duração calculada a partir de start/end quando carrega um serviço existente (diff em meses).

**2. Corte da recorrência no fluxo**

Em `src/pages/Dashboard.tsx` (`recurringEntries`, `receiptCalendar`) e `src/pages/Recebimentos.tsx`:
- Para serviços com `has_contract = true` e `contract_end_date` preenchido, só incluir a recorrência se `refMonth <= contract_end_date` (comparando por mês/ano, não por dia exato).
- Serviços sem contrato continuam ilimitados como hoje.

### Exemplo Locaweb
- has_contract = true, recurrence_start_date = 01/07/2026, duração = 3 → contract_end_date = 30/09/2026.
- Fluxo previsto: jul/ago/set 2026 mostram a recorrência; out/2026 em diante ficam zerados.

### Arquivos
- `src/pages/ServicesByCategory.tsx` — UI da seção Contrato + cálculo.
- `src/lib/pricing.ts` — helper `isContractActive(service, refMonth)` reaproveitado nas três telas.
- `src/pages/Dashboard.tsx` — aplicar `isContractActive` nos loops de serviços recorrentes.
- `src/pages/Recebimentos.tsx` — mesmo filtro ao gerar as linhas previstas.

Sem migration — usa `contract_end_date` que já existe.
