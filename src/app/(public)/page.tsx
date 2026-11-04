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
    <main
      id="main"
      className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-16"
    >
      <div>
        <p className="font-serif text-2xl font-semibold tracking-tight">SourceLedger</p>
        <h1 className="mt-6 font-serif text-4xl leading-tight font-semibold sm:text-5xl">
          Keep the evidence behind every claim.
        </h1>
        <p className="text-ink-muted mt-4 text-lg">
          A research workspace for recording claims, tracing their sources, and following how the
          evidence changes over time.
        </p>
      </div>
      <section aria-labelledby="questions-heading">
        <h2
          id="questions-heading"
          className="text-ink-muted text-sm font-semibold tracking-wide uppercase"
        >
          Every claim gets an evidence file that answers
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {QUESTIONS.map((question) => (
            <li key={question} className="border-line bg-surface rounded-lg border px-4 py-3">
              {question}
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="bg-accent text-accent-ink inline-flex min-h-11 items-center rounded-md px-5 text-sm font-medium hover:opacity-90"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="border-line bg-surface hover:bg-surface-muted inline-flex min-h-11 items-center rounded-md border px-5 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
