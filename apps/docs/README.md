# SXGerador — Documentação

Site público de documentação do SXGerador, construído com [Astro Starlight](https://starlight.astro.build/).

Publicado em **https://docs.sxgerador.com.br**.

## Desenvolvimento

```bash
pnpm --filter @sxgerador/docs dev      # http://localhost:4321
pnpm --filter @sxgerador/docs build    # gera dist/
pnpm --filter @sxgerador/docs preview  # serve o build
```

## Estrutura

```
src/
  content/
    docs/                # conteúdo em Markdown/MDX
      index.md           # home
      getting-started.md
      first-migration.md
      reference/
        sx2.md
        sx3.md
        six.md
        x3-usado.md
      concepts/
      faq.md
      contributing.md
      support.md
  styles/
    custom.css           # overrides do tema Starlight
public/
  logo.svg
astro.config.mjs         # nav lateral, locales, integrações
```

## Convenções

- Conteúdo em **pt-BR** (locale principal); inglês/espanhol podem ser adicionados em `src/content/docs/<locale>/...`.
- Snippets AdvPL em blocos ` ```advpl ` (já com syntax highlighting padrão do Shiki).
- Imagens em `src/assets/`, referenciadas com `import` para que o Astro otimize.

## Deploy

O CI (`.github/workflows/deploy.yml`) builda automaticamente em push para `main` e publica em `docs.sxgerador.com.br`.
