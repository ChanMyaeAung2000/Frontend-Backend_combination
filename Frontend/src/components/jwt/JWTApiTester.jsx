import { useCallback, useEffect, useMemo, useState } from "react";
import { decodeJwt, decodeProtectedHeader } from "jose";

const API = {
  login: "/api/auth/login",
  me: "/api/auth/me",
  verify: "/api/auth/verify",
  refresh: "/api/auth/refresh",
  logout: "/api/auth/logout",
  admin: "/api/auth/admin",
  demoUsers: "/api/auth/demo-users",
};

const DIRECT_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";
const TOKEN_KEY = "jwt_tester_token";
const USER_KEY = "jwt_tester_user";

const FALLBACK_ACCOUNTS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "john", password: "john123", role: "user" },
  { username: "guest", password: "guest123", role: "guest" },
];

const METHOD_STYLES = {
  GET: "bg-sky-500/10 text-sky-400",
  POST: "bg-emerald-500/10 text-emerald-400",
  PUT: "bg-amber-500/10 text-amber-400",
  DELETE: "bg-rose-500/10 text-rose-400",
};

function maskToken(token) {
  if (!token) return "";
  if (token.length <= 24) return token;
  return `${token.slice(0, 12)}••••••••••••${token.slice(-8)}`;
}

function formatDuration(ms) {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export default function JWTApiTester() {
  const [transport, setTransport] = useState("proxy"); // "proxy" | "direct"
  const [username, setUsername] = useState("john");
  const [password, setPassword] = useState("john123");
  const [accounts, setAccounts] = useState(FALLBACK_ACCOUNTS);

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  });

  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const origin = transport === "direct" ? DIRECT_ORIGIN : "";

  // စက္ကန့်တိုင်း clock ကို မျက်နှာပြသည် (countdown အတွက်)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Backend မှာ demo account များ ယူမည်
  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      try {
        const res = await fetch(`${origin}${API.demoUsers}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.users) && data.users.length > 0) {
          setAccounts(data.users);
        }
      } catch {
        // backend မရှိသည့်အခါ fallback list ကိုသာ သုံးမည်
      }
    }

    loadAccounts();
    return () => {
      cancelled = true;
    };
  }, [origin]);

  const decoded = useMemo(() => {
    if (!token) return null;
    try {
      return { header: decodeProtectedHeader(token), payload: decodeJwt(token) };
    } catch {
      return null;
    }
  }, [token]);

  const expiry = useMemo(() => {
    if (!decoded?.payload?.exp) return null;
    const expiresAt = decoded.payload.exp * 1000;
    const issuedAt = (decoded.payload.iat ?? decoded.payload.exp - 3600) * 1000;
    const total = Math.max(1, expiresAt - issuedAt);
    return {
      expiresAt,
      remaining: expiresAt - now,
      expired: expiresAt <= now,
      percent: Math.min(100, Math.max(0, ((expiresAt - now) / total) * 100)),
    };
  }, [decoded, now]);

  const runRequest = useCallback(
    async ({ label, path, method = "GET", body, auth = false }) => {
      const url = `${origin}${path}`;
      const headers = { Accept: "application/json" };
      if (body) headers["Content-Type"] = "application/json";
      if (auth && token) headers.Authorization = `Bearer ${token}`;

      setPending(label);
      setError("");

      const startedAt = performance.now();

      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const duration = Math.round(performance.now() - startedAt);
        const text = await res.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        const entry = {
          id: `${Date.now()}-${Math.random()}`,
          label,
          method,
          url,
          status: res.status,
          ok: res.ok,
          duration,
          requestHeaders: headers,
          requestBody: body ?? null,
          data,
          at: new Date().toLocaleTimeString(),
        };

        setLastResult(entry);
        setLogs((previous) => [entry, ...previous].slice(0, 8));

        if (!res.ok) {
          setError(data?.message || `Request failed with HTTP ${res.status}.`);
        }

        return { ok: res.ok, data };
      } catch (err) {
        const entry = {
          id: `${Date.now()}-${Math.random()}`,
          label,
          method,
          url,
          status: 0,
          ok: false,
          duration: Math.round(performance.now() - startedAt),
          requestHeaders: headers,
          requestBody: body ?? null,
          data: null,
          error: err.message,
          at: new Date().toLocaleTimeString(),
        };

        setLastResult(entry);
        setLogs((previous) => [entry, ...previous].slice(0, 8));
        setError(
          err.name === "TypeError"
            ? "Backend ကို မဆက်သွယ်နိုင်ပါ။ Backend server ကို run ထားပါ။"
            : err.message
        );

        return { ok: false, data: null };
      } finally {
        setPending("");
      }
    },
    [origin, token]
  );

  function saveSession(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }

  function clearSession() {
    setToken("");
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function handleLogin(event) {
    event?.preventDefault();

    const result = await runRequest({
      label: "Login",
      path: API.login,
      method: "POST",
      body: { username, password },
    });

    if (result.ok && result.data?.token) {
      saveSession(result.data.token, result.data.user);
    }
  }

  async function handleMe() {
    await runRequest({ label: "Get Profile", path: API.me, auth: true });
  }

  async function handleVerify() {
    await runRequest({ label: "Verify Token", path: API.verify, auth: true });
  }

  async function handleRefresh() {
    const result = await runRequest({
      label: "Refresh Token",
      path: API.refresh,
      method: "POST",
      auth: true,
    });

    if (result.ok && result.data?.token) {
      saveSession(result.data.token, result.data.user ?? user);
    }
  }

  async function handleLogout() {
    await runRequest({ label: "Logout", path: API.logout, method: "POST", auth: true });
    clearSession();
  }

  async function handleAdmin() {
    await runRequest({ label: "Admin Route", path: API.admin, auth: true });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard များကို မရောက်နိုင်ပါ။");
    }
  }

  const hasToken = Boolean(token);
  const disabled = Boolean(pending);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-sm font-semibold text-blue-400">
              DEVELOPER TOOL
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              JWT Auth API Tester
            </h1>
            <p className="mt-2 max-w-xl text-slate-400">
              Login လုပ်ပြီး backend မှာ ရရှိသော JWT token ဖြင့် protected
              route များကို စမ်းသပ်ပါ။
            </p>
          </div>

          {/* Transport switch */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-1.5">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTransport("proxy")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  transport === "proxy"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                Vite Proxy
              </button>
              <button
                type="button"
                onClick={() => setTransport("direct")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  transport === "direct"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                Direct :5000
              </button>
            </div>
            <p className="px-2 pb-1 pt-2 text-xs text-slate-500">
              {transport === "proxy"
                ? "Requests go through the Vite dev server (/api/...)"
                : "Requests hit the backend directly (tests CORS)"}
            </p>
          </div>
        </header>

        {/* ── Cards ───────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 1. Login */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/15 p-2.5 text-blue-400">
                <span className="text-xl">🔑</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Login</h2>
                <p className="text-xs text-slate-400">POST /api/auth/login</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="jwt-username"
                  className="mb-2 block text-sm font-medium"
                >
                  Username
                </label>
                <input
                  id="jwt-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="jwt-password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>
                <input
                  id="jwt-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={disabled}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending === "Login" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>Sign in &amp; get token</>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Demo accounts
              </p>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => {
                      setUsername(account.username);
                      setPassword(account.password);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-left transition hover:border-blue-500/50 hover:bg-slate-900"
                  >
                    <span className="font-mono text-sm">{account.username}</span>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      {account.password}
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                        {account.role}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 2. Session / Token */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400">
                  <span className="text-xl">🎫</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Session</h2>
                  <p className="text-xs text-slate-400">Current JWT token</p>
                </div>
              </div>

              {hasToken && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    expiry?.expired
                      ? "bg-rose-500/10 text-rose-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {expiry?.expired ? "Expired" : "Active"}
                </span>
              )}
            </div>

            {!hasToken ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center">
                <p className="text-sm text-slate-500">
                  No token yet. Login လုပ်ပြီး ရပါမယ်။
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {user && (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold uppercase text-blue-400">
                      {user.username?.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {user.email} ·{" "}
                        <span className="uppercase text-blue-400">{user.role}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Token
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowToken((value) => !value)}
                        className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs hover:bg-slate-800"
                      >
                        {showToken ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs hover:bg-slate-800"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <code className="block break-all rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-[11px] leading-5 text-slate-300">
                    {showToken ? token : maskToken(token)}
                  </code>
                </div>

                {expiry && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Expires in</span>
                      <span
                        className={`font-mono font-semibold ${
                          expiry.expired ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {formatDuration(expiry.remaining)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          expiry.expired ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${expiry.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {decoded && (
                  <div className="grid gap-3">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-sky-400">
                        Header
                      </p>
                      <pre className="overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-[11px] leading-5 text-slate-300">
                        {JSON.stringify(decoded.header, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-purple-400">
                        Payload
                      </p>
                      <pre className="overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-[11px] leading-5 text-slate-300">
                        {JSON.stringify(decoded.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={clearSession}
                  className="w-full rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-rose-500/40 hover:text-rose-400"
                >
                  Clear token (local only)
                </button>
              </div>
            )}
          </section>

          {/* 3. API calls */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/15 p-2.5 text-purple-400">
                <span className="text-xl">🛡️</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Protected Routes</h2>
                <p className="text-xs text-slate-400">
                  Authorization: Bearer &lt;token&gt;
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleMe}
                // disabled={disabled || !hasToken}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left transition hover:border-blue-500/50 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-400">
                    GET
                  </span>
                  <span className="font-mono text-sm">/api/auth/me</span>
                </span>
                <span className="text-xs text-slate-500">Profile</span>
              </button>

              <button
                type="button"
                onClick={handleVerify}
                // disabled={disabled || !hasToken}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left transition hover:border-blue-500/50 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-400">
                    GET
                  </span>
                  <span className="font-mono text-sm">/api/auth/verify</span>
                </span>
                <span className="text-xs text-slate-500">Verify</span>
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                // disabled={disabled || !hasToken}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left transition hover:border-blue-500/50 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                    POST
                  </span>
                  <span className="font-mono text-sm">/api/auth/refresh</span>
                </span>
                <span className="text-xs text-slate-500">New token</span>
              </button>

              <button
                type="button"
                onClick={handleAdmin}
                // disabled={disabled || !hasToken}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left transition hover:border-blue-500/50 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-400">
                    GET
                  </span>
                  <span className="font-mono text-sm">/api/auth/admin</span>
                </span>
                <span className="text-xs text-slate-500">Admin only</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={disabled || !hasToken}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left transition hover:border-rose-500/50 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-400">
                    POST
                  </span>
                  <span className="font-mono text-sm">/api/auth/logout</span>
                </span>
                <span className="text-xs text-slate-500">Sign out</span>
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"
              >
                {error}
              </div>
            )}

            {lastResult && (
              <div className="mt-5 border-t border-slate-800 pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">Response</h3>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                      lastResult.ok
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {lastResult.status || "ERR"} · {lastResult.duration}ms
                  </span>
                </div>
                <pre className="max-h-64 overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-[11px] leading-5 text-slate-300">
                  {JSON.stringify(lastResult.data ?? lastResult.error, null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>

        {/* ── Request log ─────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Request Log</h2>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
            >
              Clear log
            </button>
          </div>

          {logs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center text-sm text-slate-500">
              မည်သည့် request များမှ မလုပ်သေးပါ။ အထက်ပါ button များကို နှိပ်ပါ။
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((entry) => (
                <details
                  key={entry.id}
                  className="group rounded-xl border border-slate-800 bg-slate-950"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${METHOD_STYLES[entry.method] ?? "bg-slate-800 text-slate-300"}`}
                    >
                      {entry.method}
                    </span>
                    <span className="truncate font-mono text-xs text-slate-300">
                      {entry.url.replace(origin, "")}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        entry.ok
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {entry.status || "ERR"}
                    </span>
                    <span className="ml-auto hidden text-xs text-slate-500 sm:block">
                      {entry.duration}ms · {entry.at}
                    </span>
                    <span className="text-xs text-slate-500 group-open:rotate-180">
                      ▾
                    </span>
                  </summary>

                  <div className="grid gap-3 border-t border-slate-800 px-4 py-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Request
                      </p>
                      <pre className="overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-5 text-slate-400">
                        {JSON.stringify(
                          {
                            method: entry.method,
                            url: entry.url,
                            headers: {
                              ...entry.requestHeaders,
                              ...(entry.requestHeaders.Authorization
                                ? {
                                    Authorization: `Bearer ${maskToken(
                                      entry.requestHeaders.Authorization.replace(
                                        "Bearer ",
                                        ""
                                      )
                                    )}`,
                                  }
                                : {}),
                            },
                            body: entry.requestBody,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Response
                      </p>
                      <pre className="overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-5 text-slate-400">
                        {JSON.stringify(entry.data ?? entry.error, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
