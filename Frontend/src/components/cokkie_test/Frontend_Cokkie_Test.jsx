
import { useState } from "react";
import Cookies from "js-cookie";

export default function Frontend_Cokkie_Test() {
  const [name, setName] = useState("username");
  const [value, setValue] = useState("");
  const [days, setDays] = useState("7");
  const [saved, setSaved] = useState(() =>
    Cookies.get("username") || ""
  );
  const [message, setMessage] = useState("");

  function saveCookie(e) {
    e.preventDefault();

    if (!name.trim() || !value.trim()) {
      setMessage("Please enter a name and value.");
      return;
    }

    Cookies.set(name.trim(), value, {
      expires: Number(days),
      path: "/",
      sameSite: "lax",
    });

    setSaved(value);
    setMessage("Cookie saved successfully!");
  }

  function getCookie() {
    const result = Cookies.get(name.trim());

    setSaved(result ?? "");
    setMessage(
      result === undefined
        ? "Cookie not found."
        : "Cookie retrieved successfully!"
    );
  }

  function deleteCookie() {
    Cookies.remove(name.trim(), { path: "/" });
    setSaved("");
    setMessage("Cookie removed.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-blue-500/15 p-4 text-blue-400">
            <span className="text-3xl">🍪</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Cookie Manager
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage browser cookies with React
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">
              Create Cookie
            </h2>
            <p className="mb-6 mt-1 text-sm text-slate-400">
              Enter the data you want to store.
            </p>

            <form onSubmit={saveCookie} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Cookie Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="username"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Cookie Value
                </label>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter value..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Expiration
                </label>
                <select
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 active:scale-[0.98]"
              >
                Save Cookie
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">
              Stored Data
            </h2>
            <p className="mb-6 mt-1 text-sm text-slate-400">
              Read or remove your cookie.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Cookie Name
              </p>
              <p className="mt-1 break-all font-medium">
                {name || "—"}
              </p>

              <p className="mt-5 text-xs uppercase tracking-wider text-slate-500">
                Cookie Value
              </p>
              <p className="mt-1 min-h-6 break-all font-medium text-blue-400">
                {saved || "No data retrieved"}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={getCookie}
                className="rounded-xl border border-slate-700 px-3 py-3 text-sm font-semibold transition hover:bg-slate-800"
              >
                Get Cookie
              </button>
              <button
                type="button"
                onClick={deleteCookie}
                className="rounded-xl bg-rose-500/10 px-3 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
              >
                Delete
              </button>
            </div>

            {message && (
              <p
                aria-live="polite"
                className="mt-4 text-sm text-slate-300"
              >
                {message}
              </p>
            )}
          </section>
        </div>

        <footer className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="font-semibold">How it works</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Save Cookie stores your value in the browser.
            Get Cookie reads it back, and Delete removes it.
            Cookies remain available after a page refresh
            until they expire or are removed.
          </p>
        </footer>
      </div>
    </main>
  );
}
