
import { useState } from "react";

function ApiCaller() {
  const [responseMessage, setResponseMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [responseData, setResponseData] = useState(null);

  const handleApiCall = async () => {
    setStatus("loading");
    setResponseMessage("");
    setResponseData(null);

    try {
      const response = await fetch("/api", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      setResponseData(data);
      setResponseMessage(data.message || "API called successfully!");
      setStatus("success");
    } catch (error) {
      console.error("API Error:", error);
      setResponseMessage(error.message || "Proxy Error!");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
            🚀
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              API Caller
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Test your backend connection
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Backend Request
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status === "success"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : status === "error"
                  ? "bg-rose-500/10 text-rose-400"
                  : status === "loading"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {status === "idle" && "Ready"}
              {status === "loading" && "Connecting..."}
              {status === "success" && "Connected"}
              {status === "error" && "Failed"}
            </span>
          </div>

          {/* Endpoint */}
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Request Endpoint
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400">
                GET
              </span>

              <code className="break-all text-sm text-slate-200">
                /api
              </code>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleApiCall}
            disabled={status === "loading"}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Calling API...
              </>
            ) : (
              <>
                <span>⚡</span>
                Call Backend API
              </>
            )}
          </button>

          {/* Response */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Response</h3>
              <span className="text-xs text-slate-500">
                JSON
              </span>
            </div>

            <div
              aria-live="polite"
              className={`min-h-32 rounded-xl border p-4 ${
                status === "success"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : status === "error"
                  ? "border-rose-500/20 bg-rose-500/5"
                  : "border-slate-800 bg-slate-950"
              }`}
            >
              {status === "idle" && (
                <p className="text-sm leading-6 text-slate-500">
                  Click the button to send a request to your backend.
                </p>
              )}

              {status === "loading" && (
                <p className="text-sm text-amber-400">
                  Waiting for backend response...
                </p>
              )}

              {status === "success" && (
                <>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <span>✓</span>
                    Request successful
                  </div>

                  <p className="mb-3 break-words text-sm text-slate-200">
                    {responseMessage}
                  </p>

                  <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs leading-6 text-slate-400">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="mb-2 text-sm font-semibold text-rose-400">
                    ✕ Request failed
                  </div>
                  <p className="break-words text-sm text-rose-300">
                    {responseMessage}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs leading-6 text-slate-500">
          React + Tailwind CSS · Fetch API · Vite Proxy
        </p>
      </div>
    </div>
  );
}

export default ApiCaller;
