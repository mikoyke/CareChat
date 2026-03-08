# CareChat 🏥

> AI-powered clinical assistant for nurses and clinical research coordinators (CRCs), built with RAG pipeline and role-based knowledge retrieval.

**Live Demo:** https://care-chat-lime.vercel.app

---

## Overview

CareChat is a full-stack AI chat application designed for clinical professionals. Nurses and CRCs receive role-specific AI responses powered by a RAG (Retrieval-Augmented Generation) pipeline that retrieves relevant clinical documents before generating answers.

**Demo accounts:**
| Role | Email | Password |
|------|-------|----------|
| Nurse | nurse1@test.com | test123 |
| CRC | crc1@test.com | test123 |

---

## Key Features

- **Role-Based Access Control (RBAC)** — Nurses and CRCs see different AI behaviors and knowledge bases
- **RAG Pipeline** — AI answers are grounded in uploaded clinical documents using vector similarity search
- **Streaming Response** — Real-time token-by-token AI output using Server-Sent Events (SSE)
- **Multi-turn Conversation** — Full conversation history context passed to OpenAI on every request
- **Document Upload** — PDF/TXT clinical documents chunked, embedded, and stored in pgvector
- **JWT Authentication** — Secure stateless authentication with bcrypt password hashing

---

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | React, Vite, TailwindCSS                        |
| Backend    | Node.js, Express                                |
| Database   | PostgreSQL + pgvector                           |
| AI         | OpenAI GPT-4o-mini, text-embedding-3-small      |
| RAG        | LangChain, pgvector cosine similarity search    |
| Auth       | JWT, bcryptjs                                   |
| Deployment | Vercel (frontend), Railway (backend + database) |

---

## Architecture

```
User
 │
 ▼
React Frontend (Vercel)
 │  JWT in Authorization header
 ▼
Express API (Railway)
 ├── /api/auth    — Register, Login, JWT validation
 ├── /api/chat    — Streaming chat with RAG context injection
 └── /api/documents — Document upload, chunking, embedding, search
 │
 ├── OpenAI API
 │    ├── GPT-4o-mini (chat completion, streaming)
 │    └── text-embedding-3-small (document + query embedding)
 │
 └── PostgreSQL + pgvector (Railway)
      ├── users, conversations, messages
      └── documents (vector(1536) with ivfflat index)
```

---

## RAG Pipeline

```
1. Document Upload
   PDF/TXT → Text extraction → RecursiveCharacterTextSplitter
   (chunkSize: 1000, overlap: 200) → OpenAI Embedding → pgvector

2. Query Time
   User message → OpenAI Embedding → Cosine similarity search
   (threshold: 0.7, top 3) → Inject into system prompt → GPT-4o-mini
```

---

## Local Development

### Prerequisites

- Node.js v18+
- PostgreSQL 17 with pgvector extension
- OpenAI API key

### Setup

```bash
# Clone the repository
git clone https://github.com/mikoyke/CareChat.git
cd CareChat

# Backend
cd server
npm install
cp .env.example .env  # Add your API keys
npm run db:init       # Initialize database tables
npm run dev           # Start on port 3001

# Frontend
cd ../client
npm install
npm run dev           # Start on port 5173
```

### Environment Variables

**server/.env**

```
DATABASE_URL=postgresql://localhost:5432/carechat_dev
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

**client/.env**

```
VITE_API_URL=http://localhost:3001/api
```

---

## Background

Built by a developer with a nursing degree and clinical research coordinator experience. CareChat combines domain expertise with software engineering to address real pain points in clinical workflows — medication queries, protocol interpretation, and adverse event reporting.
