export class TemplatesError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'TemplatesError';
  }
}

export const TemplateErrors = {
  NOT_FOUND: new TemplatesError('Template não encontrado.', 404),
  PREFIX_IN_USE: new TemplatesError(
    'Já existe uma tabela com este prefixo no projeto. Informe outro prefixo.',
    409,
  ),
  INVALID_CONTENT: new TemplatesError('Conteúdo do template inválido.', 422),
  FORBIDDEN_SOURCE: new TemplatesError(
    'Sem permissão para publicar esta tabela como template.',
    403,
  ),
} as const;
