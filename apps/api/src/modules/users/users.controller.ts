import type { NextFunction, Request, Response } from 'express';
import type { UsersService } from './users.service';

export class UsersController {
  constructor(private readonly service: UsersService) {}

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getMe(req.user!.sub);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.updateMe(req.user!.sub, req.body);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  };

  updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { avatarUrl } = req.body as { avatarUrl: string };
      const user = await this.service.updateAvatar(req.user!.sub, avatarUrl);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.changePassword(req.user!.sub, req.body);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  deleteMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.deleteMe(req.user!.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
