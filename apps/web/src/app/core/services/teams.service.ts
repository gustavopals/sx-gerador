import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CreateTeamInput, TeamRole, UpdateTeamInput } from '@sxgerador/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TeamMemberSummary {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface ProjectInviteSummary {
  id: string;
  projectId: string;
  email: string;
  invitedById: string;
  role: TeamRole;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InviteProjectMemberInput {
  projectId: string;
  email: string;
  role: Exclude<TeamRole, 'OWNER'>;
}

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;

  async list(): Promise<TeamSummary[]> {
    const response = await firstValueFrom(
      this.http.get<{ teams: TeamSummary[] }>(`${this.baseUrl}/teams`),
    );
    return response.teams;
  }

  async get(id: string): Promise<TeamSummary> {
    const response = await firstValueFrom(
      this.http.get<{ team: TeamSummary }>(`${this.baseUrl}/teams/${id}`),
    );
    return response.team;
  }

  async create(input: CreateTeamInput): Promise<TeamSummary> {
    const response = await firstValueFrom(
      this.http.post<{ team: TeamSummary }>(`${this.baseUrl}/teams`, input),
    );
    return response.team;
  }

  async update(id: string, input: UpdateTeamInput): Promise<TeamSummary> {
    const response = await firstValueFrom(
      this.http.patch<{ team: TeamSummary }>(`${this.baseUrl}/teams/${id}`, input),
    );
    return response.team;
  }

  async delete(id: string): Promise<TeamSummary> {
    const response = await firstValueFrom(
      this.http.delete<{ team: TeamSummary }>(`${this.baseUrl}/teams/${id}`),
    );
    return response.team;
  }

  async listMembers(teamId: string): Promise<TeamMemberSummary[]> {
    const response = await firstValueFrom(
      this.http.get<{ members: TeamMemberSummary[] }>(`${this.baseUrl}/teams/${teamId}/members`),
    );
    return response.members;
  }

  async updateMemberRole(
    teamId: string,
    memberId: string,
    role: Exclude<TeamRole, 'OWNER'>,
  ): Promise<TeamMemberSummary> {
    const response = await firstValueFrom(
      this.http.patch<{ member: TeamMemberSummary }>(
        `${this.baseUrl}/teams/${teamId}/members/${memberId}`,
        { role },
      ),
    );
    return response.member;
  }

  async removeMember(teamId: string, memberId: string): Promise<TeamMemberSummary> {
    const response = await firstValueFrom(
      this.http.delete<{ member: TeamMemberSummary }>(
        `${this.baseUrl}/teams/${teamId}/members/${memberId}`,
      ),
    );
    return response.member;
  }

  async transferOwnership(teamId: string, userId: string): Promise<TeamMemberSummary> {
    const response = await firstValueFrom(
      this.http.post<{ member: TeamMemberSummary }>(
        `${this.baseUrl}/teams/${teamId}/transfer-ownership`,
        {
          userId,
        },
      ),
    );
    return response.member;
  }

  async inviteProjectMember(input: InviteProjectMemberInput): Promise<ProjectInviteSummary> {
    const response = await firstValueFrom(
      this.http.post<{ invite: ProjectInviteSummary }>(`${this.baseUrl}/project-invites`, input),
    );
    return response.invite;
  }

  async listProjectInvites(projectId: string): Promise<ProjectInviteSummary[]> {
    const response = await firstValueFrom(
      this.http.get<{ invites: ProjectInviteSummary[] }>(
        `${this.baseUrl}/projects/${projectId}/invites`,
      ),
    );
    return response.invites;
  }

  async acceptInvite(token: string): Promise<ProjectInviteSummary> {
    const response = await firstValueFrom(
      this.http.post<{ invite: ProjectInviteSummary }>(`${this.baseUrl}/project-invites/accept`, {
        token,
      }),
    );
    return response.invite;
  }

  async rejectInvite(token: string): Promise<ProjectInviteSummary> {
    const response = await firstValueFrom(
      this.http.post<{ invite: ProjectInviteSummary }>(`${this.baseUrl}/project-invites/reject`, {
        token,
      }),
    );
    return response.invite;
  }
}

export function mapTeamsError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 401) return 'Entre novamente para continuar.';
    if (err.status === 403) return 'Você não tem permissão para esta ação.';
    if (err.status === 409) return 'A ação entra em conflito com o estado atual da equipe.';
    if (err.status === 422) return 'Revise os campos destacados.';
    if (err.status === 0) return 'Sem conexão com o servidor.';
  }
  return 'Não foi possível concluir a operação.';
}
