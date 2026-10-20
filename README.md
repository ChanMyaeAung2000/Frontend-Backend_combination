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
│   │   │   └── CorsTest.jsx  # "ApiCaller" component (calls the backend)
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
node server.js          # or: npx nodemon server.js  (auto-restart on changes)
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

---

## How the Proxy Works

Instead of calling `http://localhost:5000` directly from the browser (which triggers CORS rules), the frontend calls a **relative path** on its own origin, and the Vite dev server forwards the request to the backend:

```
Browser  ──GET /api──▶  Vite dev server (:5173)  ──GET /reqapi──▶  Express (:5000)
```

Configured in `Frontend/vite.config.js`:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/reqapi'),
    },
  },
},
```

- The component requests **`/api`** (`Frontend/src/components/CorsTest.jsx`).
- Vite rewrites it to **`/reqapi`** and forwards it to the Express server.
- Same‑origin from the browser's point of view → **no CORS errors**.

### Direct CORS (alternative)

The backend also allows direct cross‑origin calls via the `cors` middleware in `Backend/server.js`:

```js
const corsOptions = {
  origin: ['http://localhost:5173'],   // only your Vite frontend
  methods: ['GET', 'POST'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
```

To use it, uncomment the direct `fetch('http://localhost:5000/reqapi')` line in `CorsTest.jsx` and comment out the `fetch('/api')` line.

> **Note:** Make sure the allowed origin matches your actual Vite URL — Vite's default port is **5173**.

---

## API Reference

| Method | Endpoint      | Description                    | Response                                                |
| ------ | ------------- | ------------------------------ | ------------------------------------------------------- |
| GET    | `/reqapi`     | Demo endpoint on the backend   | `{ "message": "Hello! This data came from the Express backend securely." }` |
| GET    | `/api`        | Frontend‑side proxy path       | Rewritten by Vite to `/reqapi` on the backend           |

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
| `node server.js`        | Start the Express server               |
| `npx nodemon server.js` | Start with auto‑restart on file changes|

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
