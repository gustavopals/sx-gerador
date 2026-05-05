import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PoMenuModule,
  PoToolbarModule,
  type PoMenuItem,
  type PoToolbarAction,
} from '@po-ui/ng-components';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'sxg-shell',
  imports: [RouterOutlet, PoMenuModule, PoToolbarModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);

  readonly menus: PoMenuItem[] = [
    { label: 'Dashboard', icon: 'an an-house', shortLabel: 'Home', link: '/' },
    { label: 'Projetos', icon: 'an an-folder', shortLabel: 'Proj.', link: '/projects' },
    { label: 'Templates', icon: 'an an-copy', shortLabel: 'Tmpl.', link: '/templates' },
    { label: 'Migrations', icon: 'an an-code', shortLabel: 'Migr.', link: '/migrations' },
  ];

  readonly toolbarActions: PoToolbarAction[] = [
    {
      label: 'Sair',
      icon: 'an an-sign-out',
      action: () => this.authService.logout(),
    },
    {
      label: 'Roadmap',
      icon: 'an an-map-trifold',
      url: 'https://github.com/gustavopals/sx-gerador',
    },
  ];
}
