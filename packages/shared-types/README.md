# @sxgerador/shared-types

Tipos TypeScript e schemas Zod compartilhados entre o frontend (`apps/web`) e o backend (`apps/api`).

## Instalação

Este pacote é consumido via workspace pnpm. Não publicar separadamente durante a Fase 0.

```json
{
  "dependencies": {
    "@sxgerador/shared-types": "workspace:*"
  }
}
```

## Uso

```ts
import { CreateUserSchema, type CreateUserInput } from '@sxgerador/shared-types';

// Validação de payload (backend ou frontend)
const result = CreateUserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten() });
}

const input: CreateUserInput = result.data;
```

## Schemas disponíveis

| Schema             | Descrição                                            |
| ------------------ | ---------------------------------------------------- |
| `UserSchema`       | Shape completo do usuário (leitura)                  |
| `CreateUserSchema` | Payload de criação (signup) com validação de senha   |
| `UpdateUserSchema` | Atualização parcial de perfil                        |
| `UserRoleSchema`   | Enum de papéis: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` |

## Scripts

```bash
pnpm build          # gera dist/ (ESM + CJS + tipos)
pnpm test           # Vitest
pnpm test:coverage  # cobertura
pnpm typecheck      # tsc --noEmit
```

## Convenções

- Todo schema Zod tem sufixo `Schema` (ex: `CreateUserSchema`)
- Tipos inferidos não têm sufixo (ex: `CreateUserInput = z.infer<typeof CreateUserSchema>`)
- Schemas que fazem sentido em ambos frontend e backend ficam aqui
- Schemas específicos de banco/ORM ficam em `apps/api`
