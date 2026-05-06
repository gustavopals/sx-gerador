export class TablesError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'TablesError';
  }
}

export const TableErrors = {
  NOT_FOUND: new TablesError('Tabela não encontrada', 404),
  PREFIX_IN_USE: new TablesError('Prefixo já está em uso neste projeto', 409),
  ALREADY_ARCHIVED: new TablesError('Tabela já está arquivada', 409),
  NOT_ARCHIVED: new TablesError('Tabela não está arquivada', 409),
} as const;
