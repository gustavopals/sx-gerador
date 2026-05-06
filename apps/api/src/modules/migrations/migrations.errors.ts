export class MigrationsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'MigrationsError';
  }
}

export const MigrationErrors = {
  DRAFT_NOT_FOUND: new MigrationsError('Draft de migration não encontrada para o projeto', 404),
  EMPTY_DRAFT: new MigrationsError('A draft atual não possui mudanças para gerar migration', 422),
  NOT_FOUND: new MigrationsError('Migration não encontrada para o projeto', 404),
  CODE_NOT_GENERATED: new MigrationsError('Migration ainda não possui código AdvPL gerado', 422),
} as const;
