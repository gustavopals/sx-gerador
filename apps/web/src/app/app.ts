import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PoMenuModule,
  PoPageModule,
  PoToolbarModule,
  PoWidgetModule,
  type PoMenuItem,
  type PoPageAction,
  type PoToolbarAction,
} from '@po-ui/ng-components';
import { environment } from '../environments/environment';

@Component({
  selector: 'sxg-root',
  imports: [RouterOutlet, PoMenuModule, PoPageModule, PoToolbarModule, PoWidgetModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly apiUrl = environment.apiUrl;
  readonly environmentName = environment.name;

  readonly menus: PoMenuItem[] = [
    { label: 'Dashboard', icon: 'an an-house', shortLabel: 'Home', link: '/' },
    { label: 'Projetos', icon: 'an an-folder', shortLabel: 'Proj.', link: '/' },
    { label: 'Templates', icon: 'an an-copy', shortLabel: 'Tmpl.', link: '/' },
    { label: 'Migrations', icon: 'an an-code', shortLabel: 'Migr.', link: '/' },
  ];

  readonly toolbarActions: PoToolbarAction[] = [
    {
      label: 'Roadmap',
      icon: 'an an-map-trifold',
      url: 'https://github.com/gustavopals/sx-gerador',
    },
  ];

  readonly pageActions: PoPageAction[] = [
    {
      label: 'Novo projeto',
      icon: 'an an-plus',
      kind: 'primary',
      disabled: true,
    },
  ];
}
