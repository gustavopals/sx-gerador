# Política de Segurança

## Versões suportadas

| Versão                | Suporte de segurança |
| --------------------- | -------------------- |
| Última `main`         | ✅                   |
| Última release tagged | ✅                   |
| Releases anteriores   | ❌                   |

## Reportando uma vulnerabilidade

**Não abra issue público.** Use um dos canais privados:

### Canal preferido — Security Advisory privado

Vá em [github.com/sxgerador/sxgerador/security/advisories/new](https://github.com/sxgerador/sxgerador/security/advisories/new) e descreva a vulnerabilidade. O GitHub nos avisa imediatamente.

### Alternativa — Email

Envie para **security@sxgerador.com.br** com:

- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto estimado (RCE, escalação, leak de dados...)
- Versão / commit afetado

Use PGP se preferir (chave em construção).

## Nosso compromisso

- **Confirmação em até 72h** de que recebemos o reporte.
- **Avaliação inicial em até 7 dias** com classificação de severidade.
- **Coordinated disclosure**: combinamos uma data para publicar o fix junto com o credit do reporter.
- **Reconhecimento público** no advisory (se você quiser).

## Hall of fame

Nenhum reporte ainda — seja o primeiro a contribuir!

## Escopo

| Em escopo                                 | Fora de escopo                            |
| ----------------------------------------- | ----------------------------------------- |
| RCE, SQLi, XSS no app SaaS                | Phishing de domínio similar               |
| Escalação de privilégios entre tenants    | Bugs em código de templates da comunidade |
| Leak de dados (projetos, emails)          | DoS por excesso de requisições legítimas  |
| Vulnerabilidades em dependências críticas | Vulnerabilidades em Protheus/AdvPL gerado |

## O que não fazer

- Não execute scans automatizados em produção sem aviso.
- Não acesse dados de outros usuários além do mínimo necessário para provar a vulnerabilidade.
- Não publique a vulnerabilidade antes do fix.
