import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export function AppHeader({ email }: { email: string | null }) {
  return (
    <header className="border-line bg-surface border-b">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/workspaces" className="font-serif text-xl font-semibold tracking-tight">
          SourceLedger
        </Link>
        <nav aria-label="Account" className="flex items-center gap-3 text-sm">
          <Link href="/workspaces" className="hover:bg-surface-muted rounded-md px-2 py-1">
            Workspaces
          </Link>
          <Link href="/settings" className="hover:bg-surface-muted rounded-md px-2 py-1">
            Settings
          </Link>
          {email ? <span className="text-ink-muted hidden sm:inline">{email}</span> : null}
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
