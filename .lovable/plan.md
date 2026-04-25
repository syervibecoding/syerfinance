Entendi agora: o Instituto Entrelares/Entrecom deve sair de Marketing e entrar em Projetos e Plataformas. O valor de R$ 6.120 deve ficar como referência visual no dashboard, mas o fluxo precisa ser mês a mês, não distribuído dia a dia.

Plano de ajuste:

1. Corrigir o cadastro do Instituto Entrelares/Entrecom
- Atualizar o serviço existente para a categoria `Plataformas`.
- Manter a recorrência de R$ 400/mês nesse cadastro, como você definiu.
- Assim ele deixa de aparecer em Marketing e passa a aparecer em Projetos e Plataformas.

2. Ajustar o dashboard para fluxo mensal
- Trocar o gráfico atual de “Fluxo de Recebimento”, que hoje divide o MRR pelos dias do mês, por uma visão mês a mês.
- O gráfico passará a mostrar cada mês como uma barra/coluna, com:
  - Entradas do mês
  - Saídas do mês
- As entradas serão calculadas por recorrências dos serviços, contratos de manutenção e outras entradas previstas, respeitando o mês.
- As saídas serão calculadas pelas despesas do mês.

3. Manter os R$ 6.120 como visual/histórico no dashboard
- Manter o registro “Histórico Março/2026” como referência visual para o dashboard.
- Usar esse valor no fluxo mensal para março/2026, sem transformar isso em cliente recorrente nem jogar para Marketing.
- Dessa forma o dashboard mostra março com R$ 6.120 nas entradas, e os meses seguintes continuam calculados mês a mês.

4. Revisar os textos para ficar claro
- Ajustar o título/descrição do gráfico para indicar que é “Fluxo mensal de entradas e saídas”.
- Evitar a leitura errada de que os R$ 6.120 são uma recorrência diária ou um cliente específico.

Detalhes técnicos:
- Será feita uma atualização de dados no cadastro do serviço do Instituto Entrelares/Entrecom.
- O código principal a ajustar é o dashboard, especialmente a lógica que hoje faz `mrrGross / diasDoMês`.
- Não será criada uma nova estrutura de banco, a menos que durante a implementação fique claro que o histórico mensal precisa virar uma tabela própria. Para este ajuste, dá para reaproveitar o registro histórico existente.