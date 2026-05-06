export class IndexesError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'IndexesError';
  }
}

export const IndexErrors = {
  NOT_FOUND: new IndexesError('Índice não encontrado', 404),
  ORDER_IN_USE: new IndexesError('Ordem de índice já está em uso nesta tabela', 409),
  PRIMARY_ORDER_CONFLICT: new IndexesError(
    'A tabela já possui índice de ordem 1. Só é permitido um índice principal por tabela',
    422,
  ),
  INVALID_KEY_FIELDS: new IndexesError(
    'Chave de índice inválida: referencia campos inexistentes na tabela',
    422,
  ),
  ALREADY_ARCHIVED: new IndexesError('Índice já está arquivado', 409),
  NOT_ARCHIVED: new IndexesError('Índice não está arquivado', 409),
} as const;
