# Lorcana Coleção

Gerenciador de coleção de cartas Disney Lorcana. Permite sincronizar o catálogo com a API Lorcast, gerenciar sua coleção pessoal, visualizar o valor de mercado, acompanhar o progresso por expansão e compartilhar um perfil público.

## Tecnologias

- **Next.js 15** — App Router, Server Actions, Server Components
- **TypeScript** — strict mode
- **Tailwind CSS v4**
- **MySQL 8+** com **Prisma 6**
- **Zod v4** — validação de esquema
- **Vitest** — testes unitários e de integração
- **Playwright** — testes E2E
- **bcryptjs** — hashing de senhas (SHA-256 para tokens de sessão)

## Requisitos

- Node.js 20+
- MySQL 8.0+
- npm 10+

## Configuração local

### 1. Clonar e instalar dependências

```bash
git clone <repo>
cd colecao
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais. Consulte a seção **Variáveis de ambiente**.

### 3. Configurar o MySQL

```sql
CREATE DATABASE lorcana_colecao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Para testes E2E:
CREATE DATABASE lorcana_colecao_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Executar migrations

```bash
npm run db:migrate
```

### 5. Criar o primeiro administrador

Configure as variáveis `ADMIN_*` no `.env.local`, depois execute:

```bash
npm run db:seed
```

### 6. Gerar cliente Prisma (se necessário)

```bash
npm run db:generate
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | `mysql://user:pass@host:3306/db` |
| `DATABASE_URL_TEST` | Testes E2E | Banco isolado para testes E2E |
| `APP_URL` | ✅ | URL pública da aplicação |
| `SESSION_SECRET` | ✅ | Segredo da sessão (mínimo 32 chars) |
| `SESSION_COOKIE_NAME` | — | Nome do cookie (padrão: `lorcana_session`) |
| `CRON_SECRET` | Cron | Segredo para sincronização automática |
| `ADMIN_NAME` | Seed | Nome do admin inicial |
| `ADMIN_USERNAME` | Seed | Username do admin inicial |
| `ADMIN_EMAIL` | Seed | Email do admin inicial |
| `ADMIN_PASSWORD` | Seed | Senha do admin inicial |
| `E2E_ADMIN_EMAIL` | Testes E2E | Email do admin para testes E2E |
| `E2E_ADMIN_PASSWORD` | Testes E2E | Senha do admin para testes E2E |
| `PLAYWRIGHT_BASE_URL` | Testes E2E | URL base (padrão: `http://localhost:3000`) |

## Execução

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # servidor de produção
```

## Testes

### Unitários / integração

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E (Playwright)

Requer servidor em execução e banco de testes separado:

```bash
# Instalar browsers (primeira vez)
npx playwright install chromium

# Com servidor já em execução em localhost:3000
npm run test:e2e

# Interface visual
npm run test:e2e:ui
```

### Lint e TypeScript

```bash
npm run lint
npm run typecheck
```

## Sincronização

### Manual

```bash
npm run sync:lorcast
```

### Automática

Endpoint protegido:

```
POST /api/cron/sync-lorcast
Authorization: Bearer <CRON_SECRET>
```

O segredo **nunca** deve ser enviado via query string — apenas via header `Authorization`.

**cron do sistema (Linux):**

```bash
crontab -e
# Adicionar (execução diária às 04:00):
0 4 * * * curl -s -X POST https://seu-site.com/api/cron/sync-lorcast \
  -H "Authorization: Bearer SEU_CRON_SECRET" >> /var/log/lorcana-sync.log 2>&1
```

**GitHub Actions:**

```yaml
name: Daily Sync
on:
  schedule:
    - cron: '0 4 * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -s -X POST ${{ secrets.APP_URL }}/api/cron/sync-lorcast \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

O endpoint retorna `409 Conflict` se uma sincronização já estiver em andamento.

## Criação do primeiro administrador

1. Configure as variáveis `ADMIN_*` no `.env.local`
2. Execute `npm run db:seed`
3. Faça login em `/entrar`
4. O link "Administração" aparece no menu da conta

## Migrations

```bash
# Desenvolvimento
npm run db:migrate

# Produção (sem interatividade)
npm run db:migrate:prod
```

Nunca edite migrations já aplicadas. Crie novas migrations.

## Build e publicação

### Checklist

```bash
npm run lint        # zero erros
npm run typecheck   # zero erros
npm run test        # todos passando
npm run build       # build limpo
```

### Variáveis obrigatórias em produção

- `DATABASE_URL`
- `APP_URL` (com `https://`)
- `SESSION_SECRET` (mínimo 32 chars aleatórios)
- `CRON_SECRET` (se usar sync automático)

### Imagens

Imagens servidas via CDN Lorcast (`cards.lorcast.io`). Nenhum arquivo de imagem é armazenado localmente — apenas as URLs do provider.

## Resolução de problemas

**EPERM no Windows ao executar `prisma generate`**

Adicione ao `next.config.ts`:
```ts
serverExternalPackages: ["@prisma/client", "prisma"]
```

**Erro "Unknown column 'ci.normal_quantity'"**

Queries raw devem usar nomes camelCase: `normalQuantity`, `foilQuantity`, `cardId`, `userId`.

**Erro P2010 com `key` em MySQL**

`key` é palavra reservada. Use alias diferente nas queries raw.

**Sessão não persiste**

Sessões ficam no banco MySQL. Verifique que `DATABASE_URL` aponta para o banco correto e que a tabela `sessions` existe.

**Sincronização lenta**

A sincronização é sequencial para respeitar rate limits da API Lorcast. ~3000 cartas levam 2–5 minutos.
