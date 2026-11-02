
import { useState } from "react";
import { SignJWT, jwtVerify, decodeJwt, decodeProtectedHeader } from "jose";

const initialPayload = JSON.stringify(
  {
    userId: 1,
    username: "john",
    role: "user",
  },
  null,
  2
);

export default function JWTTester() {
  const [payload, setPayload] = useState(initialPayload);
  const [secret, setSecret] = useState("my-demo-secret-key");
  const [token, setToken] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Create and sign a JWT
  async function handleSign() {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      if (!secret.trim()) {
        throw new Error("Please enter a secret key.");
      }

      const parsedPayload = JSON.parse(payload);

      if (
        !parsedPayload ||
        typeof parsedPayload !== "object" ||
        Array.isArray(parsedPayload)
      ) {
        throw new Error("Payload must be a JSON object.");
      }

      const secretKey = new TextEncoder().encode(secret);

      const newToken = await new SignJWT(parsedPayload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secretKey);

      setToken(newToken);
      setResult({
        type: "success",
        message: "JWT signed successfully!",
        header: decodeProtectedHeader(newToken),
        payload: decodeJwt(newToken),
      });
    } catch (err) {
      setError(err.message || "Failed to create JWT.");
    } finally {
      setLoading(false);
    }
  }

  // Verify signature and decode the JWT
  async function handleVerify() {
    setError("");
    setResult(null);
    setLoading(true);

    try {
      if (!token.trim()) {
        throw new Error("Please enter a JWT token.");
      }

      if (!secret.trim()) {
        throw new Error("Please enter the secret key.");
      }

      const secretKey = new TextEncoder().encode(secret);

      // Verifies signature and checks expiration when present
      const { payload: verifiedPayload, protectedHeader } =
        await jwtVerify(token.trim(), secretKey, {
          algorithms: ["HS256"],
        });

      setResult({
        type: "success",
        message: "Signature verified successfully!",
        header: protectedHeader,
        payload: verifiedPayload,
      });
    } catch (err) {
      setError(
        err.code === "ERR_JWT_EXPIRED"
          ? "Token has expired."
          : "Invalid token or secret key. Verification failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token);
      setError("");
      setResult((previous) =>
        previous
          ? { ...previous, copied: true }
          : previous
      );
    } catch {
      setError("Could not copy token. Check clipboard permissions.");
    }
  }

  const jsonString = (value) => JSON.stringify(value, null, 2);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <div className="mb-2 text-sm font-semibold text-blue-400">
            DEVELOPER TOOL
          </div>
          <h1 className="text-3xl font-bold">
            JWT Token Tester
          </h1>
          <p className="mt-2 text-slate-400">
            Create, inspect and verify JSON Web Tokens.
          </p>
        </header>

        <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">
          <div>
            <label className="mb-2 block font-medium">
              1. JWT Payload (JSON)
            </label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={6}
              spellCheck={false}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm outline-none focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-slate-500">
              The payload contains claims such as userId and role.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              2. Secret Key
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
              placeholder="Enter your secret key"
            />
            <p className="mt-2 text-xs text-amber-400">
              Demo only: the secret is exposed to frontend JavaScript.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSign}
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Sign JWT"}
            </button>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              Verify & Decode
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">JWT Token</h2>
            <button
              onClick={handleCopy}
              disabled={!token}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-40"
            >
              Copy token
            </button>
          </div>

          <textarea
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setResult(null);
              setError("");
            }}
            rows={4}
            spellCheck={false}
            className="w-full break-all rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-6 outline-none focus:border-blue-500"
            placeholder="Your JWT token will appear here. You can also paste a token to verify it."
          />

          {result?.copied && (
            <p className="text-sm text-green-400">
              Token copied to clipboard.
            </p>
          )}
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-red-300"
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <section className="space-y-4 rounded-2xl border border-emerald-800 bg-slate-900 p-5 sm:p-7">
            <div>
              <h2 className="text-xl font-bold text-emerald-400">
                {result.type === "success"
                  ? "✓ Result"
                  : "Result"}
              </h2>
              <p className="mt-1 text-sm text-emerald-300">
                {result.message}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold text-sky-400">
                  Header
                </h3>
                <pre className="overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
                  {jsonString(result.header)}
                </pre>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-purple-400">
                  Payload
                </h3>
                <pre className="overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
                  {jsonString(result.payload)}
                </pre>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Signature is verified by the Verify & Decode action.
              It is not decrypted or displayed as plaintext.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
