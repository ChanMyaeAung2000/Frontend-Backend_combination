# Full‑Stack CORS Proxy Demo — React (Vite) + Express

A small full‑stack project that demonstrates how a frontend can securely call a backend API, two ways:

1. **Via a Vite dev‑server proxy** (recommended — no CORS issues at all), and
2. **Via direct cross‑origin requests** guarded by the Express backend's CORS configuration.

The React app has an **API Caller** component with a button that calls the backend and displays the returned message.

---

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | React 19, Vite 8, ESLint                          |
| Backend  | Node.js, Express 5, CORS middleware, Nodemon (dev)|

---

## Project Structure

```
.
├── Frontend/                 # React + Vite app
│   ├── public/               # Static assets (favicon, icons)
│   ├── src/
│   │   ├── assets/           # Images and other bundled assets
│   │   ├── components/
│   │   │   ├── CorsTest.jsx  # "ApiCaller" component (calls the backend)
│   │   │   ├── cokkie_test/  # Cookie manager demo
│   │   │   └── jwt/
│   │   │       ├── JWTTester.jsx    # Client-side JWT sign/verify tool
│   │   │       └── JWTApiTester.jsx # UI for the backend JWT auth routes
│   │   ├── App.jsx           # Root component
│   │   ├── main.jsx          # Entry point
│   │   ├── App.css
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js        # Dev-server proxy config (/api -> backend)
│   ├── eslint.config.js
│   ├── package.json
│   └── .gitignore
│
├── Backend/                  # Express API
│   ├── server.js             # App entry point (port 5000)
│   ├── routes/
│   │   └── auth.js           # JWT auth routes (/api/auth/*)
│   ├── middleware/
│   │   └── auth.js           # authenticate + requireRole middleware
│   ├── utils/
│   │   └── jwt.js            # Token signing, demo users, config
│   ├── test/
│   │   └── auth.test.js      # JWT route test suite (node --test)
│   ├── package.json
│   └── .gitignore
│
├── .gitignore                # Root gitignore (covers the whole project)
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** (comes with Node.js)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Front_Backend_Test
```

### 2. Start the Backend (terminal 1)

```bash
cd Backend
npm install
npm start              # or: npm run dev  (nodemon, auto-restart on changes)
```

The Express server starts at **http://localhost:5000**

### 3. Start the Frontend (terminal 2)

```bash
cd Frontend
npm install
npm run dev
```

Vite starts at **http://localhost:5173**

### 4. Test it

Open http://localhost:5173 in your browser and click **“Call Backend API”**. You should see:

> Hello! This data came from the Express backend securely.

Then scroll down to the **JWT Auth API Tester** section, sign in with a demo account
(e.g. `john` / `john123`) and try the protected routes.

---

## How the Proxy Works

Instead of calling `http://localhost:5000` directly from the browser (which triggers CORS rules), the frontend calls a **relative path** on its own origin, and the Vite dev server forwards the request to the backend:

```
Browser  ──GET /api──▶  Vite dev server (:5173)  ──GET /reqapi──▶  Express (:5000)
```

Configured in `Frontend/vite.config.js`:

```js
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:5000';

server: {
  proxy: {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
      rewrite: (path) => (path === '/api' ? '/reqapi' : path),
    },
  },
},
```

- The component requests **`/api`** (`Frontend/src/components/CorsTest.jsx`).
- Vite rewrites it to **`/reqapi`** and forwards it to the Express server.
- JWT routes under **`/api/auth/*`** are *not* rewritten and reach the backend unchanged.
- Same‑origin from the browser's point of view → **no CORS errors**.

> Need the backend on another port? Run
> `VITE_API_TARGET=http://localhost:5001 npm run dev` in `Frontend/`
> and `PORT=5001 npm start` in `Backend/`.

### Direct CORS (alternative)

The backend also allows direct cross‑origin calls via the `cors` middleware in `Backend/server.js`:

```js
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'], // only your Vite frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
```

The **JWT Auth API Tester** UI has a *Vite Proxy* / *Direct :5000* switch so you can
compare both paths without changing any code.

> **Note:** Make sure the allowed origin matches your actual Vite URL — Vite's default port is **5173**.

---

## JWT Authentication

The backend issues and validates JSON Web Tokens (HS256) with `jsonwebtoken`.

### Demo accounts

| Username | Password   | Role  |
| -------- | ---------- | ----- |
| `admin`  | `admin123` | admin |
| `john`   | `john123`  | user  |
| `guest`  | `guest123` | guest |

### JWT routes (`/api/auth`)

| Method | Endpoint              | Auth | Description                                     |
| ------ | --------------------- | ---- | ----------------------------------------------- |
| GET    | `/api/auth/demo-users`| –    | List the demo accounts for the UI              |
| POST   | `/api/auth/login`     | –    | `{ username, password }` → JWT token            |
| GET    | `/api/auth/me`        | ✅   | Profile of the authenticated user               |
| GET    | `/api/auth/verify`    | ✅   | Validate the token, return the claims           |
| POST   | `/api/auth/refresh`   | ✅   | Issue a new token from a valid one              |
| POST   | `/api/auth/logout`    | ✅   | Acknowledge logout (client clears the token)    |
| GET    | `/api/auth/admin`     | ✅   | Admin‑only route (`403` for other roles)        |
| POST   | `/api/auth/decode`    | –    | Verify + decode a token sent in the body        |

✅ = requires the `Authorization: Bearer <token>` header.

### Try it with curl

```bash
# 1. Login → get a token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"john","password":"john123"}' | jq -r .token)

# 2. Call a protected route
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer $TOKEN"

# 3. Admin-only route (login as admin first)
curl http://localhost:5000/api/auth/admin -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Configuration

| Variable         | Default                 | Purpose                             |
| ---------------- | ----------------------- | ----------------------------------- |
| `JWT_SECRET`     | `dev-only-secret-change-me` | Signing secret (set in production) |
| `JWT_EXPIRES_IN` | `1h`                    | Token lifetime                      |
| `PORT`           | `5000`                  | Backend port                        |

### Frontend UI — *JWT Auth API Tester*

`Frontend/src/components/jwt/JWTApiTester.jsx` is a small dashboard that exercises every
route above:

- **Login card** — username/password form, clickable demo accounts, `Sign in & get token`.
- **Session card** — the stored token (masked/reveal/copy), live expiry countdown, and the
  decoded header + payload.
- **Protected Routes card** — buttons for `/me`, `/verify`, `/refresh`, `/admin`, `/logout`
  with the response body, HTTP status and duration.
- **Request Log** — every request with method, URL, status, timing and the full
  request/response payloads (the token in the log is masked).

The token is stored in `localStorage`, so it survives a page refresh.

### Backend tests

```bash
cd Backend
npm test        # node --test test/*.test.js
```

Covers login (valid/invalid/missing), protected routes, tampered tokens, refresh,
role checks and the 404 handler.

---

## API Reference

| Method | Endpoint      | Description                    | Response                                                |
| ------ | ------------- | ------------------------------ | ------------------------------------------------------- |
| GET    | `/reqapi`     | Demo endpoint on the backend   | `{ "message": "Hello! This data came from the Express backend securely." }` |
| GET    | `/api`        | Frontend‑side proxy path       | Rewritten by Vite to `/reqapi` on the backend           |
| *      | `/api/auth/*` | JWT routes (see above)         | JSON with `success` + `message` fields                  |

---

## Available Scripts

### Frontend (`Frontend/`)

| Command          | Description                              |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | Start the Vite dev server (with HMR)     |
| `npm run build`  | Build the app for production             |
| `npm run preview`| Preview the production build locally     |
| `npm run lint`   | Run ESLint                               |

### Backend (`Backend/`)

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `npm start`             | Start the Express server               |
| `npm run dev`           | Start with auto‑restart on file changes|
| `npm test`              | Run the JWT auth test suite            |

---

## Git Ignore Setup

Three `.gitignore` files keep your repo clean (dependencies, builds, logs, secrets, and editor files are never committed):

- **`/.gitignore`** — covers the entire project (use this when you only track the repo root)
- **`Frontend/.gitignore`** — Vite/React specific
- **`Backend/.gitignore`** — Node/Express specific

If you add environment variables later, create a **`.env.example`** file with placeholder values and commit only that — the real `.env` is ignored.

---

## Troubleshooting

| Problem | Solution |
| ------- | -------- |
| `Proxy Error!` when clicking the button | Make sure the backend is running on port **5000** before using the frontend. |
| CORS error on direct calls | Check the `origin` list in `Backend/server.js` matches your frontend URL (default `http://localhost:5173`). |
| Port already in use | Change the port in `Backend/server.js` (`PORT`) or run Vite on another port: `npm run dev -- --port 3000` (update the CORS origin if you do). |
| `node_modules` committed by accident | The provided `.gitignore` files exclude them; run `git rm -r --cached node_modules` and commit if they were added earlier. |
