# BASEGOL

Plataforma profissional para o **Campeonato Paulista de Base** — clubes, atletas, jogos ao vivo, tabelas, estatísticas e notícias.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + Shadcn/UI + Framer Motion
- **MySQL** + **Prisma ORM**
- **NextAuth** (credenciais)
- **RBAC** (SUPER_ADMIN, ADMIN_LIGA, ADMIN_CLUBE, EDITOR, SCOUT, VISITANTE)
- **PWA** (manifest + service worker)
- **Zod** para validação de payloads críticos

## Pré-requisitos

- Node.js 20+
- MySQL 8+
- npm ou pnpm

## Instalação

```bash
cd BaseGol
npm install
cp .env.example .env
```

Edite `.env`:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/basegol"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-uma-string-aleatoria-longa"
```

## Banco de dados

```bash
# Criar banco no MySQL
mysql -u root -p -e "CREATE DATABASE basegol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Aplicar schema
npm run db:push

# Popular dados de demonstração
npm run db:seed
```

Credenciais do seed:

- `master@basegol.com.br` / `Master#2026!` (**SUPER_ADMIN**)
- `liga@basegol.com.br` / `Liga#2026!` (**ADMIN_LIGA**)
- `palmeiras.admin@basegol.com.br` / `Palmeiras#26` (**ADMIN_CLUBE**)
- `santos.admin@basegol.com.br` / `Santos#26` (**ADMIN_CLUBE**)
- `editor@basegol.com.br` / `Editor#2026!` (**EDITOR**)
- `scout@basegol.com.br` / `Scout#2026!` (**SCOUT**)

## Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Build e produção

```bash
npm run build
npm start
```

## Estrutura principal

```
app/              # Rotas (público, admin, clube, API)
components/       # UI, layout, matches, clubs, admin
lib/              # Prisma, auth, utils, mock-data
services/         # Camada de negócio
prisma/           # Schema + seed
public/           # PWA, ícones, assets
types/            # TypeScript globais
```

## API REST

| Rota | Descrição |
|------|-----------|
| `GET /api/matches` | Jogos (`?status=LIVE`) |
| `GET /api/matches/[id]` | Detalhe da partida |
| `GET /api/championships` | Campeonatos |
| `GET /api/clubs` | Clubes |
| `GET /api/athletes` | Atletas |
| `GET /api/news` | Notícias |
| `GET /api/statistics` | Artilheiros e tabela |
| `POST /api/auth/request-password-reset` | Solicitar reset |
| `POST /api/auth/reset-password` | Confirmar reset |
| `POST /api/auth/impersonate` | Entrar como usuário (SUPER_ADMIN) |
| `POST /api/auth/stop-impersonation` | Encerrar impersonação |
| `POST /api/upload` | Upload de imagem/documento (Vercel Blob em produção) |

## PWA

O app é instalável no celular. Em produção, o service worker (`public/sw.js`) faz cache básico da home e do manifest.

## Segurança e governança

- Senha com hash `bcrypt`
- Troca obrigatória de senha no primeiro acesso
- Fluxo de redefinição de senha com token
- Middleware de proteção por rota e papel
- Auditoria de ações administrativas (`audit_logs`)
- Impersonação controlada para `SUPER_ADMIN`

## Deploy

Compatível com **Vercel**, **Railway** ou VPS com Node. Configure `DATABASE_URL`, `NEXTAUTH_*` e `BLOB_READ_WRITE_TOKEN` (Vercel → Storage → Blob) para upload de imagens em produção.

## Licença

Projeto privado — Sistema A7 / BASEGOL.
