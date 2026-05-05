import type { NextFunction, Request, Response } from 'express';
import type { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.signup(req.body);
      res.status(201).json({ message: 'Conta criada. Verifique seu e-mail.' });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokens = await this.service.login(req.body, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      res.json(tokens);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const tokens = await this.service.refresh(refreshToken);
      res.json(tokens);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await this.service.logout(refreshToken);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body as { token: string };
      await this.service.verifyEmail(token);
      res.json({ message: 'E-mail verificado com sucesso.' });
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as { email: string };
      await this.service.forgotPassword(email);
      res.json({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções.' });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body as { token: string; password: string };
      await this.service.resetPassword(token, password);
      res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (err) {
      next(err);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body as { email: string };
      await this.service.resendVerificationEmail(email);
      res.json({
        message: 'Se o e-mail estiver cadastrado e não verificado, você receberá um novo link.',
      });
    } catch (err) {
      next(err);
    }
  };
}
