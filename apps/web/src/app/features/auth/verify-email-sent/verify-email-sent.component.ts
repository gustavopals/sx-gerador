import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PoButtonModule, PoIconModule } from '@po-ui/ng-components';
import { PoPageBackgroundModule } from '@po-ui/ng-templates';

@Component({
  selector: 'sxg-verify-email-sent',
  imports: [RouterLink, PoPageBackgroundModule, PoButtonModule, PoIconModule],
  templateUrl: './verify-email-sent.component.html',
  styleUrl: './verify-email-sent.component.scss',
})
export class VerifyEmailSentComponent {}
