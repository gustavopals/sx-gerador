export class FieldsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'FieldsError';
  }
}

export const FieldErrors = {
  NOT_FOUND: new FieldsError('Campo não encontrado', 404),
  INVALID_NAME: new FieldsError('Nome de campo inválido para a tabela informada', 422),
  NAME_IN_USE: new FieldsError('Nome de campo já está em uso nesta tabela', 409),
  ORDER_IN_USE: new FieldsError('Ordem de campo já está em uso nesta tabela', 409),
  ALREADY_ARCHIVED: new FieldsError('Campo já está arquivado', 409),
  NOT_ARCHIVED: new FieldsError('Campo não está arquivado', 409),
  INVALID_REORDER_LIST: new FieldsError(
    'Lista de reordenação inválida para a tabela informada',
    422,
  ),
  INVALID_BULK_LIST: new FieldsError(
    'Nenhum campo válido encontrado para atualização em lote',
    422,
  ),
} as const;
