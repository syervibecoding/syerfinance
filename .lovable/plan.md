# Reorganização do menu lateral

Reagrupar os 10 itens atuais em 4 seções com títulos e adicionar botão para colapsar a sidebar (modo só ícones).

## Nova estrutura do menu

```
VISÃO GERAL
  • Dashboard

SERVIÇOS
  • Projetos & Plataformas
  • Serviços Marketing
  • Sites
  • Manutenção & Web Ops
  • Certificado Digital

OPERAÇÕES
  • Calendário de Tráfego
  • Quadro de Atividades
  • Empresas & Sociedades

FINANCEIRO
  • Despesas & Custos
```

Cada grupo tem um título pequeno em maiúsculas (`text-[11px] uppercase tracking-wider text-muted-foreground`) acima dos itens. Sem accordion — tudo sempre visível, só visualmente separado.

## Botão de colapsar

- Botão na borda direita da sidebar (ícone de seta), também acessível por um trigger no header.
- Estados: **expandida** (256px, com labels e títulos de grupo) ou **colapsada** (64px, só ícones centralizados, títulos de grupo viram um divisor fino).
- Tooltip ao passar o mouse nos ícones quando colapsada, mostrando o nome do item.
- Estado persistido em `localStorage` para lembrar a preferência entre sessões.

## Como adicionar novas categorias depois

A lista `nav` em `AppLayout.tsx` vira uma estrutura agrupada:

```ts
const navGroups = [
  { label: "Visão Geral", items: [{ to: "/", label: "Dashboard", icon: ... }] },
  { label: "Serviços", items: [...] },
  { label: "Operações", items: [...] },
  { label: "Financeiro", items: [...] },
];
```

Para criar uma categoria nova, basta adicionar um objeto `{ to, label, icon }` no grupo apropriado (ou criar um novo grupo).

## Arquivos afetados

- `src/components/AppLayout.tsx` — substitui o array `nav` plano por `navGroups`, adiciona estado `collapsed` com persistência em localStorage, ajusta classes de largura, renderiza títulos de grupo e tooltips quando colapsado.

Sem mudanças no roteamento (`App.tsx`) nem no banco.
