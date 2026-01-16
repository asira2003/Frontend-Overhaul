"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../src/api/administration/authenticationApi";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await login(username, password);
      if (response && response.ok) {
        let token = null;
        try {
          const json = await response.clone().json();
          token = json?.token || json?.accessToken;
        } catch (_) {
          // ignore parse errors
        }
        if (token) {
          sessionStorage.setItem("token", token);
          router.push("/users");
        } else {
          setError(
            "Login succeeded without token. Please verify API response."
          );
        }
      } else {
        setError("Invalid credentials or server error.");
      }
    } catch (err) {
      setError("Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6 shadow-card backdrop-blur">
        <h1 className="mb-6 text-center text-2xl font-semibold text-neutral-100">
          Admin Portal
        </h1>
        {error && (
          <div className="mb-4 rounded-md border border-red-800/60 bg-red-900/20 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-300">
              Username
            </label>
            <input
              type="text"
              className="h-11 w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-3 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              placeholder="your-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-300">
              Password
            </label>
            <input
              type="password"
              className="h-11 w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-3 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-md bg-neutral-100 text-neutral-900 hover:bg-white/90 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-neutral-500">
          Use valid admin credentials to continue.
        </p>
      </div>
    </div>
  );
}
