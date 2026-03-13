# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareChat is a full-stack AI-powered clinical decision support application for healthcare professionals (nurses and clinical research coordinators). It uses a RAG pipeline to provide role-specific AI assistance based on uploaded documents.

## Monorepo Structure

- `client/` — React 19 frontend (Vite, TailwindCSS v4, React Router v7)
- `server/` — Node.js/Express 5 backend (PostgreSQL + pgvector, OpenAI, LangChain)

## Commands

### Frontend (`client/`)
```bash
npm run dev       # Dev server on port 5173
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`server/`)
```bash
npm run dev       # nodemon on port 3001
npm start         # Production start
npm run db:init   # Initialize PostgreSQL schema (run once)
```

## Environment Variables

**Backend (`server/.env`):**
```
DATABASE_URL=postgresql://localhost:5432/carechat_dev
JWT_SECRET=...
OPENAI_API_KEY=...
FRONTEND_URL=http://localhost:5173
PORT=3001
```

**Frontend (`client/.env`):**
```
VITE_API_URL=http://localhost:3001/api
```

## Architecture

### Authentication & Authorization
- JWT tokens stored in `localStorage`, attached via Axios request interceptor ([client/src/api/axios.js](client/src/api/axios.js))
- `AuthContext` ([client/src/context/AuthContext.jsx](client/src/context/AuthContext.jsx)) manages global auth state and verifies token on mount via `GET /api/auth/me`
- Server middleware ([server/middleware/auth.js](server/middleware/auth.js)): `authenticate` (JWT verify) + `authorize` (RBAC by role)
- Two roles: `nurse` and `crc` — system prompts and document access are role-scoped

### Chat & Streaming
- Chat UI ([client/src/pages/Chat.jsx](client/src/pages/Chat.jsx)) uses native Fetch API with `ReadableStream` for SSE
- Server ([server/routes/chat.js](server/routes/chat.js)) streams GPT-4o-mini responses as `data: {"text": "..."}` / `data: {"done": true}` events
- Each message triggers a RAG context lookup before calling OpenAI

### RAG Pipeline
- Documents (PDF/TXT, max 10MB) uploaded via `POST /api/documents/upload`
- Text chunked with `RecursiveCharacterTextSplitter` (1000 chars, 200 overlap), embedded with `text-embedding-3-small` (1536 dims), stored in pgvector
- Search uses cosine similarity with a 0.7 threshold ([server/services/ragService.js](server/services/ragService.js))
- Documents are role-scoped — nurses and CRCs only see their own role's documents

### Database
- PostgreSQL with pgvector extension required
- Tables: `users`, `conversations`, `messages`, `message_feedback`, `documents`
- Vector index: IVFFlat on `documents.embedding` for cosine similarity
- Schema defined in [server/scripts/init-db.js](server/scripts/init-db.js)

## Deployment

- **Frontend:** Vercel — `client/vercel.json` configures SPA routing (`/(.*) → /index.html`)
- **Backend:** Railway — `server/Procfile` runs `node index.js`
- CORS allows `http://localhost:5173` and `FRONTEND_URL` env var
