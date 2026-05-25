/** Build de auditoria Lighthouse: otimizado como produção, API local. */
export const environment = {
  production: true,
  name: 'lighthouse',
  apiUrl: 'http://localhost:3000/api/v1',
} as const;
