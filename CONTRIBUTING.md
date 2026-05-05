# Contribuindo com o SXGerador

Obrigado por considerar contribuir com o SXGerador. Este projeto nasce com a proposta
de ser uma ferramenta aberta, gratuita e útil para a comunidade Protheus.

## Antes de Começar

Leia o [IDEIA.md](IDEIA.md). Ele é a fonte principal sobre visão de produto,
arquitetura, domínio Protheus, roadmap e critérios de aceite.

## Ambiente Local

Requisitos planejados:

- Node.js 22
- pnpm
- Docker e Docker Compose

Depois que a Fase 0 estiver completa, o fluxo local esperado será:

```bash
pnpm install
pnpm db:up
pnpm dev
pnpm test
pnpm lint
```

## Fluxo de Trabalho

1. Escolha uma task do roadmap no `IDEIA.md`.
2. Crie uma branch a partir de `main`, usando o ID da task quando possível.
3. Faça mudanças pequenas e focadas.
4. Adicione ou atualize testes quando a mudança alterar comportamento.
5. Abra um pull request descrevendo a task, o que mudou e como foi validado.

Exemplos de branches:

```bash
feat/F3.2-prefix-validator
fix/F4.2-x3-usado-encoding
docs/F0.1-repository-foundation
```

## Commits

Use Conventional Commits:

```bash
feat(fields): add field name validator
fix(advpl): correct x3 usado encoding
docs(readme): update setup instructions
chore(repo): add editorconfig
```

## Qualidade

As decisões técnicas devem seguir os princípios do `IDEIA.md`:

- TypeScript em modo strict.
- Validação compartilhada com Zod quando fizer sentido.
- Lógica crítica de domínio coberta por testes.
- Código pequeno, legível e alinhado com os padrões existentes.
- Atenção especial aos encoders de bitmap e à geração AdvPL.

## Pull Requests

Antes de abrir um PR, confira:

- A task do roadmap está referenciada.
- O escopo está claro e pequeno.
- Testes relevantes foram executados ou a limitação foi explicada.
- Documentação foi atualizada quando necessário.

## Segurança

Não commite segredos, tokens, arquivos `.env` reais ou dados privados de clientes.
Use apenas `.env.example` para documentar variáveis de ambiente.
