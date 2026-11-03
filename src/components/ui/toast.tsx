"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";
type ToastMessage = { id: number; tone: ToastTone; text: string };

type ToastApi = {
  success: (text: string) => void;
  error: (text: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const push = useCallback((tone: ToastTone, text: string) => {
    const id = nextId.current++;
    setMessages((current) => [...current, { id, tone, text }]);
    window.setTimeout(() => {
      setMessages((current) => current.filter((message) => message.id !== id));
    }, 5000);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ success: (text) => push("success", text), error: (text) => push("error", text) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {messages.map((message) => (
          <p
            key={message.id}
            className={
              message.tone === "success"
                ? "pointer-events-auto rounded-md bg-support px-4 py-2 text-sm font-medium text-white shadow-lg"
                : "pointer-events-auto rounded-md bg-contradict px-4 py-2 text-sm font-medium text-white shadow-lg"
            }
          >
            {message.text}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
