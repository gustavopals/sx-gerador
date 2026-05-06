import { Component, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoNotificationService,
  PoPageModule,
  PoTagModule,
  PoTagType,
} from '@po-ui/ng-components';
import {
  mapTeamsError,
  TeamsService,
  type ProjectInviteSummary,
} from '../../../core/services/teams.service';

@Component({
  selector: 'sxg-invite-accept',
  imports: [PoButtonModule, PoPageModule, PoTagModule],
  templateUrl: './invite-accept.component.html',
  styleUrl: './invite-accept.component.scss',
})
export class InviteAcceptComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamsService = inject(TeamsService);
  private readonly notification = inject(PoNotificationService);

  readonly token = signal('');
  readonly isLoading = signal(false);
  readonly invite = signal<ProjectInviteSummary | null>(null);
  readonly tagType = PoTagType;

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      void this.router.navigate(['/teams']);
      return;
    }
    this.token.set(token);
  }

  async accept(): Promise<void> {
    await this.answer('accept');
  }

  async reject(): Promise<void> {
    await this.answer('reject');
  }

  goToTeams(): void {
    void this.router.navigate(['/teams']);
  }

  private async answer(kind: 'accept' | 'reject'): Promise<void> {
    this.isLoading.set(true);
    try {
      const result =
        kind === 'accept'
          ? await this.teamsService.acceptInvite(this.token())
          : await this.teamsService.rejectInvite(this.token());
      this.invite.set(result);
      this.notification.success(kind === 'accept' ? 'Convite aceito.' : 'Convite recusado.');
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    } finally {
      this.isLoading.set(false);
    }
  }
}
