/**
 * PasswordGate — Clean minimal lock screen for /generator.
 * White/zinc aesthetic matching the rest of the app.
 */
"use client";

import { useState, useEffect } from "react";

const CORRECT_PASSWORD = "LetsGetHacking@123";
const SESSION_KEY = "hma_unlocked";

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
    } else {
      setError("Incorrect password. Try again.");
      setPassword("");
    }
  }

  if (!mounted) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">HackMyApartment</h1>
          <p className="text-zinc-400 text-sm mt-1">Creator Studio — restricted access</p>
        </div>

        {/* Card */}
        <div className="border border-zinc-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-zinc-900 mb-1">Enter password</h2>
          <p className="text-zinc-400 text-sm mb-5">This page is only available to the @hackmyapartment team.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                autoFocus
                className="w-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
              />
              {error && (
                <p className="text-red-500 text-xs mt-2">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              Unlock Studio
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-400 text-xs mt-6">
          Looking for the shop?{" "}
          <a href="/shop" className="text-zinc-600 hover:text-zinc-900 underline transition">
            Browse the storefront →
          </a>
        </p>
      </div>
    </div>
  );
}
