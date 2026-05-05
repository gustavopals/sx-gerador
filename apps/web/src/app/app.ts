import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './stores/auth.store';

@Component({
  selector: 'sxg-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {
  private readonly authStore = inject(AuthStore);

  constructor() {
    this.authStore.initialize();
  }
}
