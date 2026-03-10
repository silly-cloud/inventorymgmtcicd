# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MERN stack inventory management system with CRUD operations for products. MongoDB + Express backend (port 3001), React frontend (port 3000 dev / port 80 via Nginx in Docker).

## Common Commands

### Backend (run from `Backend/`)
- `npm run server` — Start dev server with Nodemon (auto-reload)
- `npm start` — Start production server
- `npm test` — Run Jest tests with coverage (`--forceExit --detectOpenHandles`)
- `npx eslint . --format stylish --max-warnings -1` — Lint (zero warnings allowed)

### Frontend (run from `Frontend/inventory_management_system/`)
- `npm start` — React dev server
- `npm run build` — Production build
- `npm test` — Jest tests (watch mode); use `CI=true npm test -- --coverage` for single-run with coverage
- `npx eslint src/ --format stylish --max-warnings -1` — Lint

### Docker (run from project root)
- `docker-compose up` — Start all services (MongoDB, backend, frontend)
- `docker-compose down` — Stop all services

## Architecture

### Backend (`Backend/`)
- **Entry point:** `server.js` connects to MongoDB via `db.js`, then starts Express app from `app.js`
- **`app.js`** — Express middleware setup (CORS, JSON parser), mounts routes
- **`Routes/router.js`** — All API endpoints in a single router file
- **`Models/Products.js`** — Single Mongoose model with fields: `ProductName` (String), `ProductPrice` (Number), `ProductBarcode` (Number, unique)
- **Environment:** `MONGO_URI` (default: `mongodb://mongodb:27017/IMS`), `PORT` (default: 3001)

### API Endpoints (defined in `Routes/router.js`)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/insertproduct` | Checks barcode uniqueness, returns 422 on duplicate |
| GET | `/products` | List all products |
| GET | `/products/:id` | Single product by Mongo `_id` |
| PUT | `/updateproduct/:id` | Update product |
| DELETE | `/deleteproduct/:id` | Delete product |

All success responses use status 201; errors use 422 (conflict) or 500.

### Frontend (`Frontend/inventory_management_system/`)
- Create React App project with React Router v6
- Components in `src/components/`: Home, Navbar, Products, InsertProduct, UpdateProduct, About
- Uses Fetch API with relative URLs (`/api/products`, `/api/insertproduct`, etc.)
- Component-level state only (useState/useEffect hooks, no Redux)
- Bootstrap 5 for styling (loaded via CDN, not npm)
- Dev proxy: `"proxy": "http://finalback:3001"` in package.json

### Production Networking (Docker)
- Nginx serves the React build and proxies `/api/*` requests to `backend:3001`
- Docker Compose defines three services: `mongodb`, `backend`, `frontend`

## Testing

### Backend Tests (`Backend/__test__/routes.test.js`)
- Jest + Supertest; Products model is fully mocked (no DB required)
- Tests all 5 route handlers including error cases

### Frontend Tests (`Frontend/.../src/components/__tests__/`)
- React Testing Library + Jest; fetch is mocked globally
- Separate test file per component, wrapped in MemoryRouter

### CI Coverage Threshold
- Both backend and frontend enforce **80% coverage** in CI (GitHub Actions)

## Linting Rules
- **Backend:** ESLint flat config (`eslint.config.js`) — `no-unused-vars` (error, ignores `_` prefix), `eqeqeq` (warn), `no-var` (warn), `no-console` off
- **Frontend:** `.eslintrc.json` extends `react-app` — same `no-unused-vars` pattern, `no-console` (warn), `eqeqeq` (warn)

## CI/CD Pipeline (GitHub Actions)
Workflows run on push/PR to `main` and `release/*`:
1. **test.yml** — Runs backend and frontend tests with coverage checks
2. **lint.yml** — Runs ESLint on both sides
3. **security-sca.yml** — OWASP Dependency-Check (CVSS threshold 7), runs after test+lint pass
4. **trigger-jenkins.yml** — Triggers Jenkins build after SCA passes (main/release branches only)
5. **notify-slack.yml** — Reusable Slack notification workflow
