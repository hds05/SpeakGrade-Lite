"use client";

import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

export default function DashboardProfilePage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
      <header className="border-b border-white/40 bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
          >
            ← Back to dashboard
          </Link>
          <span className="text-sm font-semibold text-gray-700">Account</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-8">
        <p className="mb-6 max-w-xl text-center text-sm text-gray-600">
          Manage your email, password, and security settings. Password changes and
          recovery options are handled securely by Clerk.
        </p>
        <UserProfile
          path="/dashboard/profile"
          routing="path"
          appearance={{
            elements: {
              rootBox: "w-full shadow-xl rounded-xl overflow-hidden",
              card: "shadow-none",
            },
          }}
        />
      </main>
    </div>
  );
}
