import { Component } from '@angular/core';
import { PoPageModule, PoWidgetModule, type PoPageAction } from '@po-ui/ng-components';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'sxg-home',
  imports: [PoPageModule, PoWidgetModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly apiUrl = environment.apiUrl;
  readonly environmentName = environment.name;

  readonly pageActions: PoPageAction[] = [
    {
      label: 'Novo projeto',
      icon: 'an an-plus',
      kind: 'primary',
      disabled: true,
    },
  ];
}
