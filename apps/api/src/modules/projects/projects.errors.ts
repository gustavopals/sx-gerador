export class ProjectsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ProjectsError';
  }
}

export const ProjectErrors = {
  NOT_FOUND: new ProjectsError('Projeto não encontrado', 404),
  SLUG_IN_USE: new ProjectsError('Slug já está em uso', 409),
  ALREADY_ARCHIVED: new ProjectsError('Projeto já está arquivado', 409),
  NOT_ARCHIVED: new ProjectsError('Projeto não está arquivado', 409),
} as const;
