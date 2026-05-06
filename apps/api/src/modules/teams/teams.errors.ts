export class TeamsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'TeamsError';
  }
}

export const TeamErrors = {
  NOT_FOUND: new TeamsError('Equipe não encontrada', 404),
  MEMBER_NOT_FOUND: new TeamsError('Membro não encontrado', 404),
  INVITE_NOT_FOUND: new TeamsError('Convite não encontrado', 404),
  PROJECT_NOT_FOUND: new TeamsError('Projeto não encontrado', 404),
  SLUG_IN_USE: new TeamsError('Slug já está em uso', 409),
  EMAIL_ALREADY_INVITED: new TeamsError('Email já possui convite pendente para este projeto', 409),
  USER_ALREADY_MEMBER: new TeamsError('Usuário já é membro da equipe', 409),
  LAST_OWNER: new TeamsError('A equipe deve manter ao menos um owner ativo', 409),
  INVALID_INVITE: new TeamsError('Convite inválido ou expirado', 409),
  PROJECT_WITHOUT_TEAM: new TeamsError('Projeto não pertence a uma equipe', 409),
  OWNER_ROLE_REQUIRES_TRANSFER: new TeamsError(
    'Use transferência de ownership para definir OWNER',
    409,
  ),
  FORBIDDEN: new TeamsError('Você não tem permissão para executar esta ação', 403),
  AUTH_REQUIRED: new TeamsError('Usuário autenticado obrigatório', 401),
};
