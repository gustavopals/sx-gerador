import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PoMenuModule,
  PoToolbarModule,
  type PoMenuItem,
  type PoToolbarAction,
} from '@po-ui/ng-components';
import { AuthStore } from '../stores/auth.store';

@Component({
  selector: 'sxg-shell',
  imports: [RouterOutlet, PoMenuModule, PoToolbarModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authStore = inject(AuthStore);

  readonly menus: PoMenuItem[] = [
    { label: 'Dashboard', icon: 'an an-house', shortLabel: 'Home', link: '/' },
    { label: 'Projetos', icon: 'an an-folder', shortLabel: 'Proj.', link: '/projects' },
    { label: 'Templates', icon: 'an an-copy', shortLabel: 'Tmpl.', link: '/templates' },
    { label: 'Migrations', icon: 'an an-code', shortLabel: 'Migr.', link: '/migrations' },
    { label: 'Perfil', icon: 'an an-user', shortLabel: 'Perfil', link: '/settings/profile' },
  ];

  readonly toolbarActions: PoToolbarAction[] = [
    {
      label: 'Sair',
      icon: 'an an-sign-out',
      action: () => this.authStore.logout(),
    },
    {
      label: 'Roadmap',
      icon: 'an an-map-trifold',
      url: 'https://github.com/gustavopals/sx-gerador',
    },
  ];
}
