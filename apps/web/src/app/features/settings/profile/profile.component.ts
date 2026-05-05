import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal, ViewChild, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, type AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PoAvatarModule,
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoModalModule,
  PoNotificationService,
  PoPageModule,
  type PoModalAction,
  type PoModalComponent,
  type PoSelectOption,
} from '@po-ui/ng-components';
import { AuthStore } from '../../../stores/auth.store';

const MAX_AVATAR_BYTES = 900_000;

function strongPasswordValidator(control: AbstractControl): { weak: true } | null {
  const v: string = control.value ?? '';
  const ok = v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v);
  return ok ? null : { weak: true };
}

function passwordMatchValidator(control: AbstractControl): { mismatch: true } | null {
  const parent = control.parent;
  if (!parent) return null;
  return control.value === parent.get('newPassword')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'sxg-profile',
  imports: [
    ReactiveFormsModule,
    PoAvatarModule,
    PoButtonModule,
    PoFieldModule,
    PoModalModule,
    PoPageModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  @ViewChild('deleteAccountModal') private readonly deleteAccountModal?: PoModalComponent;

  readonly authStore = inject(AuthStore);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);

  readonly submitType = PoButtonType.Submit;
  readonly avatarLoading = signal(false);
  readonly passwordLoading = signal(false);
  readonly deleteLoading = signal(false);

  readonly localeOptions: PoSelectOption[] = [
    { label: 'Português (Brasil)', value: 'pt-BR' },
    { label: 'English (US)', value: 'en-US' },
    { label: 'Español', value: 'es-ES' },
  ];

  readonly profileForm = new FormBuilder().group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    locale: ['pt-BR', [Validators.required]],
  });

  readonly passwordForm = new FormBuilder().group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, strongPasswordValidator]],
    confirmPassword: ['', [Validators.required, passwordMatchValidator]],
  });

  readonly deleteForm = new FormBuilder().group({
    confirmation: ['', [Validators.required, Validators.pattern(/^EXCLUIR$/)]],
  });

  constructor() {
    effect(() => {
      const user = this.authStore.user();
      if (!user || !('name' in user)) return;

      this.profileForm.patchValue(
        {
          name: user.name,
          locale: user.locale,
        },
        { emitEvent: false },
      );
    });
  }

  ngOnInit(): void {
    void this.loadProfile();
    this.passwordForm.controls.newPassword.valueChanges.subscribe(() => {
      this.passwordForm.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
    });
  }

  get nameError(): string {
    const c = this.profileForm.controls.name;
    if (c.touched && c.hasError('required')) return 'Nome é obrigatório';
    if (c.touched && c.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get currentPasswordError(): string {
    const c = this.passwordForm.controls.currentPassword;
    if (c.touched && c.hasError('required')) return 'Senha atual é obrigatória';
    return '';
  }

  get newPasswordError(): string {
    const c = this.passwordForm.controls.newPassword;
    if (c.touched && c.hasError('required')) return 'Nova senha é obrigatória';
    if (c.touched && c.hasError('weak')) return 'Mínimo 8 caracteres, 1 maiúscula e 1 número';
    return '';
  }

  get confirmPasswordError(): string {
    const c = this.passwordForm.controls.confirmPassword;
    if (c.touched && c.hasError('required')) return 'Confirme a nova senha';
    if (c.touched && c.hasError('mismatch')) return 'Senhas não coincidem';
    return '';
  }

  get deleteConfirmationError(): string {
    const c = this.deleteForm.controls.confirmation;
    if (c.touched && c.hasError('required')) return 'Confirmação é obrigatória';
    if (c.touched && c.hasError('pattern')) return 'Digite EXCLUIR exatamente como exibido';
    return '';
  }

  get deletePrimaryAction(): PoModalAction {
    return {
      label: 'Excluir conta',
      danger: true,
      loading: this.deleteLoading(),
      disabled: this.deleteForm.invalid || this.deleteLoading(),
      action: () => void this.deleteAccount(),
    };
  }

  get deleteSecondaryAction(): PoModalAction {
    return {
      label: 'Cancelar',
      disabled: this.deleteLoading(),
      action: () => this.closeDeleteModal(),
    };
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    try {
      const { name, locale } = this.profileForm.value;
      await this.authStore.updateProfile({ name: name!, locale: locale! });
      this.notification.success('Perfil atualizado.');
    } catch {
      this.notification.error('Não foi possível salvar o perfil.');
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading.set(true);
    try {
      const { currentPassword, newPassword } = this.passwordForm.value;
      await this.authStore.changePassword({
        currentPassword: currentPassword!,
        newPassword: newPassword!,
      });
      this.passwordForm.reset();
      this.notification.success('Senha alterada. Entre novamente.');
      await this.router.navigate(['/login']);
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        this.notification.error('Senha atual inválida.');
      } else {
        this.notification.error('Não foi possível alterar a senha.');
      }
    } finally {
      this.passwordLoading.set(false);
    }
  }

  async uploadAvatar(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notification.warning('Escolha uma imagem PNG, JPG ou WebP.');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      this.notification.warning('Use uma imagem de até 900KB.');
      return;
    }

    this.avatarLoading.set(true);
    try {
      await this.authStore.uploadAvatar(await readAsDataUrl(file));
      this.notification.success('Avatar atualizado.');
    } catch {
      this.notification.error('Não foi possível atualizar o avatar.');
    } finally {
      this.avatarLoading.set(false);
    }
  }

  openDeleteModal(): void {
    this.deleteForm.reset();
    this.deleteAccountModal?.open();
  }

  closeDeleteModal(): void {
    this.deleteAccountModal?.close();
  }

  async deleteAccount(): Promise<void> {
    if (this.deleteForm.invalid) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    this.deleteLoading.set(true);
    try {
      await this.authStore.deleteAccount();
      this.closeDeleteModal();
      this.notification.success(
        'Conta marcada para exclusão. Enviamos uma confirmação por e-mail.',
      );
      await this.router.navigate(['/login']);
    } catch {
      this.notification.error('Não foi possível excluir sua conta.');
    } finally {
      this.deleteLoading.set(false);
    }
  }

  private async loadProfile(): Promise<void> {
    try {
      await this.authStore.loadCurrentUser();
    } catch {
      this.notification.error('Não foi possível carregar seu perfil.');
    }
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
