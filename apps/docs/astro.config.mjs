import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://docs.sxgerador.com.br',
  integrations: [
    starlight({
      title: 'SXGerador',
      description:
        'Plataforma open source de migrations AdvPL para dicionário de dados Protheus (SX2, SX3, SIX).',
      logo: {
        light: '/public/logo.svg',
        dark: '/public/logo-dark.svg',
        replacesTitle: false,
      },
      social: {
        github: 'https://github.com/sxgerador/sxgerador',
      },
      defaultLocale: 'pt-BR',
      locales: {
        'pt-BR': { label: 'Português', lang: 'pt-BR' },
      },
      sidebar: [
        { label: 'Início', link: '/' },
        {
          label: 'Começando',
          items: [
            { label: 'Início rápido', link: '/getting-started/' },
            { label: 'Primeira migration em 5 min', link: '/first-migration/' },
          ],
        },
        {
          label: 'Referência',
          items: [
            { label: 'SX2 — Tabelas', link: '/reference/sx2/' },
            { label: 'SX3 — Campos', link: '/reference/sx3/' },
            { label: 'SIX — Índices', link: '/reference/six/' },
            { label: 'X3_USADO (bitmap)', link: '/reference/x3-usado/' },
          ],
        },
        {
          label: 'Conceitos',
          items: [
            { label: 'Projetos e equipes', link: '/concepts/projects/' },
            { label: 'Templates', link: '/concepts/templates/' },
            { label: 'Diff e histórico', link: '/concepts/diff/' },
          ],
        },
        {
          label: 'Comunidade',
          items: [
            { label: 'FAQ', link: '/faq/' },
            { label: 'Contribuindo', link: '/contributing/' },
            { label: 'Canais de feedback', link: '/support/' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
