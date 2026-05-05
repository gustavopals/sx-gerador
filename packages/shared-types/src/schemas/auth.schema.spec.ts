import { describe, expect, it } from 'vitest';
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
  UpdateProfileSchema,
} from './auth.schema';

const validSignup = {
  name: 'Gustavo Pals',
  email: 'gustavo@example.com',
  password: 'Senha123',
  acceptedTerms: true as const,
};

describe('SignupSchema', () => {
  it('accepts valid input', () => {
    const result = SignupSchema.parse(validSignup);
    expect(result.locale).toBe('pt-BR');
  });

  it('rejects invalid email', () => {
    expect(() => SignupSchema.parse({ ...validSignup, email: 'bad' })).toThrow();
  });

  it('rejects password without uppercase', () => {
    expect(() => SignupSchema.parse({ ...validSignup, password: 'senha123' })).toThrow();
  });

  it('rejects password without number', () => {
    expect(() => SignupSchema.parse({ ...validSignup, password: 'SenhaSemNum' })).toThrow();
  });

  it('rejects password shorter than 8 chars', () => {
    expect(() => SignupSchema.parse({ ...validSignup, password: 'Ab1' })).toThrow();
  });

  it('rejects when terms not accepted', () => {
    expect(() =>
      SignupSchema.parse({ ...validSignup, acceptedTerms: false as unknown as true }),
    ).toThrow();
  });
});

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    const result = LoginSchema.parse({ email: 'user@example.com', password: 'anypass' });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => LoginSchema.parse({ email: 'not-email', password: 'pass' })).toThrow();
  });

  it('rejects empty password', () => {
    expect(() => LoginSchema.parse({ email: 'user@example.com', password: '' })).toThrow();
  });
});

describe('ForgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(ForgotPasswordSchema.parse({ email: 'user@example.com' })).toEqual({
      email: 'user@example.com',
    });
  });

  it('rejects invalid email', () => {
    expect(() => ForgotPasswordSchema.parse({ email: 'not-email' })).toThrow();
  });
});

describe('ResetPasswordSchema', () => {
  const valid = { token: 'abc123token', password: 'NewPass1' };

  it('accepts valid token and password', () => {
    expect(ResetPasswordSchema.parse(valid)).toEqual(valid);
  });

  it('rejects empty token', () => {
    expect(() => ResetPasswordSchema.parse({ ...valid, token: '' })).toThrow();
  });

  it('rejects password without uppercase', () => {
    expect(() => ResetPasswordSchema.parse({ ...valid, password: 'newpass1' })).toThrow();
  });

  it('rejects password without number', () => {
    expect(() => ResetPasswordSchema.parse({ ...valid, password: 'NewPassSemNum' })).toThrow();
  });

  it('rejects password shorter than 8 chars', () => {
    expect(() => ResetPasswordSchema.parse({ ...valid, password: 'Ab1' })).toThrow();
  });
});

describe('UpdateProfileSchema', () => {
  it('accepts partial updates', () => {
    expect(UpdateProfileSchema.parse({ name: 'Novo Nome' })).toEqual({ name: 'Novo Nome' });
    expect(UpdateProfileSchema.parse({ locale: 'es-ES' })).toEqual({ locale: 'es-ES' });
    expect(UpdateProfileSchema.parse({})).toEqual({});
  });

  it('rejects invalid locale', () => {
    expect(() => UpdateProfileSchema.parse({ locale: 'fr-FR' })).toThrow();
  });
});
