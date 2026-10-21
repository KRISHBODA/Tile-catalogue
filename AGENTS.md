# AI Coding Assistant Guidelines & Architectural Blueprint

> **CRITICAL INSTRUCTION FOR ALL AI ASSISTANTS (Antigravity, Cursor, Claude Code, Copilot, etc.):**
> Before writing, generating, or modifying any code in this repository, you **MUST** read and adhere to the architectural rules, directory patterns, and layer boundaries detailed below. Do not deviate from these patterns.

---

## 1. Project Overview & Separation of Concerns

This project consists of two independent, decoupled workspaces:
- **`frontend/`**: Pure Next.js (App Router) client application.
- **`backend/`**: Production-grade Node.js + Express + TypeScript service.

```
Tile-catalogue/
├── frontend/               # Presentation & UI only
├── backend/                # API, Business Logic & Database operations
└── AGENTS.md               # This architectural guide
```

---

## 2. Backend Architecture (`backend/src/`)

The backend strictly follows a **Layered Architecture**. Each layer has a single, isolated responsibility.

```
backend/src/
├── config/                 # Validated environment (.env) & DB connection client
├── constants/              # HTTP status codes, response messages, app limits
├── types/                  # Domain entities, DTOs, interface contracts
├── repositories/           # DATA ACCESS LAYER (Direct DB/ORM queries ONLY)
├── services/               # BUSINESS LOGIC LAYER (Pure rules, ZERO DB queries)
├── controllers/            # PRESENTATION LAYER (HTTP req/res orchestration)
├── routes/                 # Express route definitions
├── middlewares/            # Error handling, request logging, 404 handler
├── utils/                  # Standard ApiResponse and AppError classes
├── app.ts                  # Express application pipeline
└── server.ts               # HTTP listener & graceful shutdown
```

### Strict Backend Rules:
1. **Service Layer Purity (NO DB CALLS IN SERVICES)**:
   - Services implement `IService` contracts and depend **only** on `IRepository` interfaces.
   - **NEVER** write SQL queries, ORM calls (Prisma, Mongoose, Knex, etc.), or database access logic inside a service.
   - Services contain pure business logic: calculations, validations, slug generation, permission rules, and orchestrating repositories.
2. **Repository Layer Exclusivity**:
   - **ALL** database reads, writes, updates, and deletes **MUST** reside exclusively in `src/repositories/`.
   - Repositories must not contain business rules or validation logic.
3. **Controller Decoupling**:
   - Controllers unpack HTTP parameters, queries, and bodies, pass them to services, and send standard `ApiResponse` objects.
   - Controllers **NEVER** touch repositories or databases directly.
4. **No Hardcoded Strings / Codes**:
   - Use `HttpStatusCodes` from `constants/httpStatusCodes.ts`.
   - Use `ResponseMessages` from `constants/responseMessages.ts`.
   - Use `AppConstants` from `constants/app.constants.ts`.
5. **Execution Command**:
   - Always run with `pnpm dev` in the `backend/` directory.

---

## 3. Frontend Architecture (`frontend/src/`)

The frontend is a **pure client application**.

```
frontend/src/
├── components/
│   ├── common/             # Reusable UI components (Folder-per-Component)
│   │   ├── Button/         # Button.tsx, Button.module.css, index.ts
│   │   ├── Modal/          # Modal.tsx, Modal.module.css, index.ts
│   │   ├── Badge/          # Badge.tsx, Badge.module.css, index.ts
│   │   └── index.ts        # Master barrel export
│   └── layout/             # Shell, headers, sidebars
│
├── constants/              # Centralized constants (api.constants.ts, routes.constants.ts)
├── translations/           # en.json (Centralized copy dictionary)
├── context/                # TranslationContext (useTranslation() hook)
│
├── services/               # Dedicated API client calling the Node.js backend
│   ├── apiClient.ts        # Fetch client with base URL & ApiError handling
│   ├── productService.ts   # Product API service
│   └── index.ts
│
├── features/               # Feature-Driven Architecture (Vertical Slices)
│   └── [feature_name]/     # e.g., products, catalogues
│       ├── components/     # Feature-specific UI components
│       ├── hooks/          # Feature-specific custom hooks
│       ├── utils/          # Pure helper & validation functions
│       ├── types/          # Feature domain types & DTOs
│       ├── data/           # Sample / mock initial data
│       └── index.ts        # Public Feature Gateway (Export barrier)
│
└── app/                    # Next.js App Router pages (ZERO API routes)
```

### Strict Frontend Rules:
1. **NO API Routes in Next.js**:
   - **DO NOT create `src/app/api/` route handlers in Next.js.**
   - Next.js serves purely as a frontend. All backend operations must go through `src/services/` targeting the Node.js backend (`http://127.0.0.1:5000/api/v1`).
2. **Folder-per-Component Pattern**:
   - Every common component in `src/components/common/` **MUST** follow:
     ```
     [ComponentName]/
     ├── [ComponentName].tsx
     ├── [ComponentName].module.css
     └── index.ts
     ```
3. **Styling with Scoped CSS Modules**:
   - Use `.module.css` for component styles instead of inline 30-class strings in JSX.
   - Reference styles cleanly: `className={`${styles.button} ${styles.primary}`}`.
4. **NO Hardcoded UI Text Strings**:
   - **NEVER** write raw user-facing English strings directly inside JSX tags.
   - All text must be defined in `src/translations/en.json` and consumed via:
     ```tsx
     const { t } = useTranslation();
     <h1>{t("products.title")}</h1>
     ```
5. **Feature-Driven Architecture**:
   - When creating or modifying a feature in `src/features/`, follow the exact internal structure (`components/`, `hooks/`, `utils/`, `types/`, `data/`, `index.ts`).
   - Only import from a feature's public gateway (`@/features/[feature_name]`).
6. **Execution Command**:
   - Run with `npm run dev` or `npm run build` in `frontend/`.

---

## 4. Git & Test Policy

- **Do NOT create `.test` or `.spec` files** unless explicitly requested by the user.
- All test patterns are ignored in `.gitignore`.
- Always verify changes before completing work:
  - Frontend: `npm run typecheck`
  - Backend: `pnpm typecheck`
