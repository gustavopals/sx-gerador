import { Component, inject, type OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

@Component({
  selector: 'sxg-landing',
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  readonly currentYear = new Date().getFullYear();
  readonly isAuthenticated = this.authStore.isAuthenticated;

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      void this.router.navigate(['/projects'], { replaceUrl: true });
    }
  }

  readonly features: FeatureCard[] = [
    {
      icon: 'an an-table',
      title: 'SX2, SX3 e SIX em um só lugar',
      description:
        'Crie tabelas, campos e índices com validação automática de prefixo, bitmaps de X3_USADO e índice principal único.',
    },
    {
      icon: 'an an-code',
      title: 'Migration AdvPL gerada',
      description:
        'Exporte scripts .PRW prontos para rodar no Protheus — sem mais cliques manuais no SIGACFG.',
    },
    {
      icon: 'an an-users-three',
      title: 'Colaboração por equipe',
      description:
        'Convide outros devs, controle papéis (Owner/Admin/Member/Viewer) e versione dicionários em time.',
    },
    {
      icon: 'an an-stack',
      title: 'Templates da comunidade',
      description:
        'Aplique tabelas reutilizáveis em um clique. Comece de templates oficiais ou publique os seus.',
    },
    {
      icon: 'an an-arrows-clockwise',
      title: 'Diff visual e histórico',
      description:
        'Veja exatamente o que mudou entre versões do dicionário. Auditoria completa, sem mistério.',
    },
    {
      icon: 'an an-globe',
      title: 'Trilíngue (PT · ES · EN)',
      description:
        'Títulos e descrições nas três línguas suportadas pelo Protheus, do jeito que a TOTVS espera.',
    },
  ];

  readonly testimonials: Testimonial[] = [
    {
      quote:
        'Substituiu nosso processo manual no SIGACFG. O time agora versiona dicionário como código.',
      author: 'Beta tester',
      role: 'Tech Lead · ERP TOTVS',
    },
    {
      quote: 'O X3_USADO é o pesadelo de qualquer desenvolvedor AdvPL. Aqui é só clicar.',
      author: 'Beta tester',
      role: 'Desenvolvedor Protheus sênior',
    },
  ];

  goToApp(): void {
    if (this.isAuthenticated()) {
      void this.router.navigate(['/projects']);
      return;
    }
    void this.router.navigate(['/signup']);
  }
}
