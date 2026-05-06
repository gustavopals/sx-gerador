export class PermissionsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'PermissionsError';
  }
}

export const PermissionErrors = {
  AUTH_REQUIRED: new PermissionsError('Usuário autenticado obrigatório', 401),
  FORBIDDEN: new PermissionsError('Você não tem permissão para executar esta ação', 403),
};
