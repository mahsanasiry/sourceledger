import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export function AppHeader({ email }: { email: string | null }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/workspaces" className="font-serif text-xl font-semibold tracking-tight">
          SourceLedger
        </Link>
        <nav aria-label="Account" className="flex items-center gap-3 text-sm">
          <Link href="/workspaces" className="rounded-md px-2 py-1 hover:bg-surface-muted">
            Workspaces
          </Link>
          <Link href="/settings" className="rounded-md px-2 py-1 hover:bg-surface-muted">
            Settings
          </Link>
          {email ? <span className="hidden text-ink-muted sm:inline">{email}</span> : null}
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
