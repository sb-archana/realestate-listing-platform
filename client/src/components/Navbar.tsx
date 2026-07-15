"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-teal-700">
          <span className="inline-block h-7 w-7 rounded-md bg-teal-600" aria-hidden />
          EstateHub
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/properties" className="hover:text-teal-700">
            Browse
          </Link>
          {!loading && user && (
            <>
              <Link href="/properties/new" className="hover:text-teal-700">
                Add Listing
              </Link>
              <Link href="/dashboard" className="hover:text-teal-700">
                Dashboard
              </Link>
            </>
          )}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {loading ? null : user ? (
            <>
              <span className="text-sm text-slate-500">Hi, {user.name.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Log in
              </Link>
              <Link href="/register" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 sm:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="text-lg">☰</span>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            <Link href="/properties" onClick={() => setMenuOpen(false)}>
              Browse
            </Link>
            {!loading && user ? (
              <>
                <Link href="/properties/new" onClick={() => setMenuOpen(false)}>
                  Add Listing
                </Link>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-left text-red-600">
                  Log out
                </button>
              </>
            ) : (
              !loading && (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    Sign up
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
