import Link from "next/link";

const QUESTIONS = [
  "Where did this claim come from?",
  "Which sources support it, and which contradict it?",
  "What exactly did the source say, not just where is the link?",
  "Has the evidence changed since?",
  "Who changed a note or conclusion, and why?",
];

export default function LandingPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="font-serif text-2xl font-semibold tracking-tight">SourceLedger</p>
        <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
          Keep the evidence behind every claim.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          A research workspace for recording claims, tracing their sources, and following how the
          evidence changes over time.
        </p>
      </div>
      <section aria-labelledby="questions-heading">
        <h2 id="questions-heading" className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Every claim gets an evidence file that answers
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {QUESTIONS.map((question) => (
            <li key={question} className="rounded-lg border border-line bg-surface px-4 py-3">
              {question}
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-ink hover:opacity-90"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-5 text-sm font-medium hover:bg-surface-muted"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
