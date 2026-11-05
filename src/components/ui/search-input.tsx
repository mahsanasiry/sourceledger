"use client";

import { useEffect, useRef } from "react";

type SearchInputProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  className?: string;
  delayMs?: number;
  onCommit: (value: string) => void;
};

export function SearchInput({
  id,
  label,
  value,
  placeholder,
  className,
  delayMs = 300,
  onCommit,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const lastCommitted = useRef(value);
  const commitRef = useRef(onCommit);

  useEffect(() => {
    commitRef.current = onCommit;
  });

  // The field is uncontrolled so that a slow url update can never overwrite what is being typed.
  // The url value is copied in only when it changes for a reason other than our own commit.
  useEffect(() => {
    if (value.trim() === lastCommitted.current.trim()) return;
    window.clearTimeout(timer.current);
    lastCommitted.current = value;
    if (inputRef.current) inputRef.current.value = value;
  }, [value]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="flex min-w-56 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-ink-muted text-xs font-medium">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="search"
        defaultValue={value}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            lastCommitted.current = next;
            commitRef.current(next);
          }, delayMs);
        }}
        className={className}
      />
    </div>
  );
}
