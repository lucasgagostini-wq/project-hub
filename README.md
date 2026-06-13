# project-hub

Gestão de projetos e ofertas. Monorepo simples:

- `frontend/` — app React + Vite (a interface; PWA instalável).
- `backend/`  — API Node + TypeScript + Express + Prisma (esqueleto com endpoints stub).

---

## 1. Subir para o seu repositório

A partir da pasta `project-hub`:

```bash
git init
git add .
git commit -m "primeira versão: frontend + backend"
git branch -M main
git remote add origin https://github.com/lucasgagostini-wq/project-hub.git
git push -u origin main
```

> Se o repositório já tiver commits, faça `git pull origin main --allow-unrelated-histories`
> antes do push, ou suba numa branch e abra um Pull Request.

## 2. Rodar localmente

**Frontend**
```bash
cd frontend
npm install
npm run dev        # abre em http://localhost:5173
```

**Backend**
```bash
cd backend
cp .env.example .env      # preencha DATABASE_URL e JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev               # http://localhost:4000
```

## 3. Deploy

### Frontend (Vercel ou Netlify) — recomendado, é o mais rápido
1. Conecte o repositório no painel da Vercel/Netlify.
2. Configure o projeto apontando para a pasta `frontend`:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Deploy. A Vercel/Netlify já serve por HTTPS — então o PWA fica instalável
   (gere antes os ícones em `frontend/public/icons/`).

Pela CLI da Vercel:
```bash
cd frontend && npx vercel --prod
```

### Backend (Render, Railway ou Fly.io)
O backend precisa de um **PostgreSQL** e de um host Node. Passos gerais:
1. Crie um banco PostgreSQL no provedor e copie a `DATABASE_URL`.
2. Crie um Web Service apontando para a pasta `backend`:
   - **Build:** `npm install && npm run prisma:generate && npm run build`
   - **Start:** `npm start`
   - **Env vars:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (a URL do frontend).
3. Rode a migration uma vez (`npx prisma migrate deploy`).

> Lembrete: os endpoints do backend estão como stub (`501`). Eles sobem e respondem,
> mas a lógica precisa ser implementada — veja `backend/README.md` e `backend/docs/API.md`.

## Notas
- O frontend funciona sozinho com dados de exemplo (não depende do backend para abrir).
- Integrações (UTMfy, Google Agenda) e persistência real dependem do backend.
