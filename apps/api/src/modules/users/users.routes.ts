import {
  AvatarUploadSchema,
  ChangePasswordSchema,
  DeleteAccountSchema,
  UpdateProfileSchema,
} from '@sxgerador/shared-types';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { UsersController } from './users.controller';
import type { UsersService } from './users.service';

export function createUsersRouter(service: UsersService): Router {
  const router = Router();
  const ctrl = new UsersController(service);

  router.get('/users/me', requireAuth, ctrl.getMe);
  router.patch('/users/me', requireAuth, validate(UpdateProfileSchema), ctrl.updateMe);
  router.post('/users/me/avatar', requireAuth, validate(AvatarUploadSchema), ctrl.updateAvatar);
  router.post(
    '/users/me/change-password',
    requireAuth,
    validate(ChangePasswordSchema),
    ctrl.changePassword,
  );
  router.delete('/users/me', requireAuth, validate(DeleteAccountSchema), ctrl.deleteMe);

  return router;
}
