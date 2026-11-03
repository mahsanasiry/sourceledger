import { cn } from "@/lib/utils/cn";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const CONTROL =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted disabled:opacity-60 aria-[invalid=true]:border-contradict";

type FieldShellProps = {
  label: string;
  error?: string;
  hint?: string;
  children: (ids: { controlId: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
};

function FieldShell({ label, error, hint, children }: FieldShellProps) {
  const controlId = useId();
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="text-sm font-medium">
        {label}
      </label>
      {children({ controlId, describedBy: describedBy || undefined, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-contradict">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type CommonProps = { label: string; error?: string; hint?: string };

export const TextField = forwardRef<HTMLInputElement, CommonProps & InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ label, error, hint, className, ...props }, ref) {
    return (
      <FieldShell label={label} error={error} hint={hint}>
        {({ controlId, describedBy, invalid }) => (
          <input
            ref={ref}
            id={controlId}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cn(CONTROL, className)}
            {...props}
          />
        )}
      </FieldShell>
    );
  },
);

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextAreaField({ label, error, hint, className, rows = 3, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {({ controlId, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={controlId}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(CONTROL, className)}
          {...props}
        />
      )}
    </FieldShell>
  );
});

export const SelectField = forwardRef<
  HTMLSelectElement,
  CommonProps & SelectHTMLAttributes<HTMLSelectElement>
>(function SelectField({ label, error, hint, className, children, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {({ controlId, describedBy, invalid }) => (
        <select
          ref={ref}
          id={controlId}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(CONTROL, className)}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
});
