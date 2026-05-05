import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PoMenuModule,
  PoToolbarModule,
  type PoMenuItem,
  type PoToolbarAction,
} from '@po-ui/ng-components';

@Component({
  selector: 'sxg-root',
  imports: [RouterOutlet, PoMenuModule, PoToolbarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
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
}
