export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const Errors = {
  EMAIL_IN_USE: new AuthError('E-mail já cadastrado', 409),
  INVALID_CREDENTIALS: new AuthError('E-mail ou senha inválidos', 401),
  EMAIL_NOT_VERIFIED: new AuthError('E-mail não verificado', 403),
  INVALID_TOKEN: new AuthError('Token inválido ou expirado', 401),
  TOKEN_ALREADY_USED: new AuthError('Token já utilizado', 401),
} as const;
