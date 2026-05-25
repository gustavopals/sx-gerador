/** @type {import('./run-audit.mjs').AuditPage[]} */
module.exports = [
  { id: 'login', path: '/login', auth: false, label: 'Login' },
  { id: 'signup', path: '/signup', auth: false, label: 'Cadastro' },
  { id: 'forgot-password', path: '/forgot-password', auth: false, label: 'Esqueci senha' },
  { id: 'home', path: '/', auth: true, label: 'Dashboard' },
  { id: 'projects', path: '/projects', auth: true, label: 'Projetos' },
  {
    id: 'project-detail',
    path: '/projects/__PROJECT_ID__',
    auth: true,
    label: 'Detalhe do projeto',
    dynamic: 'projectId',
  },
  {
    id: 'table-detail',
    path: '/projects/__PROJECT_ID__/tables/__TABLE_ID__',
    auth: true,
    label: 'Detalhe da tabela',
    dynamic: 'projectTable',
  },
  {
    id: 'migrations',
    path: '/projects/__PROJECT_ID__/migrations',
    auth: true,
    label: 'Migrations',
    dynamic: 'projectId',
  },
  {
    id: 'generate-migration',
    path: '/projects/__PROJECT_ID__/migrations/generate',
    auth: true,
    label: 'Gerar migration',
    dynamic: 'projectId',
  },
  { id: 'teams', path: '/teams', auth: true, label: 'Equipes' },
  { id: 'templates', path: '/templates', auth: true, label: 'Templates' },
  { id: 'settings-profile', path: '/settings/profile', auth: true, label: 'Perfil' },
];
