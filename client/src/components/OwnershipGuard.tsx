"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

export function OwnershipGuard({ ownerId, children }: { ownerId: string; children: ReactNode }) {
  const { user } = useAuth();

  if (user && user.id !== ownerId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        You can only edit listings you own.{" "}
        <Link href="/dashboard" className="font-semibold underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
