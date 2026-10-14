"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Types --------------------------------------------------------------

type ToastVariant = "success" | "error" | "warning" | "info";

type ToastPosition =
  | "top-right"
  | "top-center"
  | "bottom-right"
  | "bottom-center";

interface ToastInput {
  message: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many milliseconds. Defaults to 4000. */
  duration?: number;
}

interface ToastRecord {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  fire: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  position: ToastPosition;
  toasts: ToastRecord[];
}

// ---- Context ------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

// ---- useToast -----------------------------------------------------------

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a <Toaster>.");
  }
  return ctx;
}

// ---- ID generator -------------------------------------------------------

let nextId = 0;
function genId(): string {
  nextId += 1;
  return `toast-${nextId}`;
}

// ---- ToastProvider ------------------------------------------------------

interface ToastProviderProps {
  children?: ReactNode;
  position?: ToastPosition;
  max?: number;
}

export function ToastProvider({
  children,
  position = "bottom-center",
  max = 3,
}: ToastProviderProps): JSX.Element {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const fire = useCallback(
    (input: ToastInput): string => {
      const id = genId();
      const record: ToastRecord = {
        id,
        message: input.message,
        variant: input.variant ?? "info",
        duration: input.duration ?? 4000,
      };
      setToasts((current) => {
        const next = [...current, record];
        return next.length > max ? next.slice(next.length - max) : next;
      });
      return id;
    },
    [max]
  );

  const value = useMemo<ToastContextValue>(
    () => ({ fire, dismiss, position, toasts }),
    [fire, dismiss, position, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

// ---- ToastViewport ------------------------------------------------------

const viewportPositions: Record<ToastPosition, string> = {
  "top-right": "top-4 right-4 items-end",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};

function ToastViewport(): JSX.Element | null {
  const ctx = useContext(ToastContext);

  if (typeof document === "undefined") return null;
  if (!ctx || ctx.toasts.length === 0) return null;

  const { toasts, dismiss, position } = ctx;

  return createPortal(
    <div
      role="region"
      aria-label="Notifications"
      className={cn(
        "fixed z-50 flex flex-col gap-2 pointer-events-none",
        viewportPositions[position]
      )}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>,
    document.body
  );
}

// ---- ToastItem ----------------------------------------------------------

interface ToastItemProps {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}

const variantDotClasses: Record<ToastVariant, string> = {
  success: "text-status-ready",
  error: "text-status-cancelled",
  warning: "text-status-active",
  info: "text-guest-text-secondary [data-world=staff]_&:text-staff-text-secondary",
};

function ToastItem({ toast, onDismiss }: ToastItemProps): JSX.Element {
  const { id, message, variant, duration } = toast;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current !== null) return;
    timerRef.current = setTimeout(() => {
      setExiting(true);
      exitTimerRef.current = setTimeout(() => onDismiss(id), 220);
    }, duration);
  }, [duration, id, onDismiss]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      clearTimer();
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [startTimer, clearTimer]);

  const onMouseEnter = useCallback(() => clearTimer(), [clearTimer]);
  const onMouseLeave = useCallback(() => startTimer(), [startTimer]);

  const role =
    variant === "error" || variant === "warning" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "pointer-events-auto flex items-start gap-3 " +
          "w-[320px] max-w-[calc(100vw-2rem)] rounded-lg " +
          "px-4 py-3 shadow-lg " +
          "bg-guest-surface-raised text-guest-text-primary " +
          "[data-world=staff]_&:bg-staff-surface-raised " +
          "[data-world=staff]_&:text-staff-text-primary " +
          "border " +
          "border-guest-border-subtle " +
          "[data-world=staff]_&:border-staff-border-subtle " +
          "transition-[transform,opacity] " +
          "data-[world=guest]:duration-guest-fast " +
          "data-[world=guest]:ease-guest-out " +
          "data-[world=staff]:duration-staff-fast " +
          "data-[world=staff]:ease-staff-out",
        exiting && "opacity-0",
        exiting && "[data-world=staff]_&:translate-x-full"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full bg-current",
          variantDotClasses[variant]
        )}
      />
      <p className="flex-1 text-[14px] leading-[20px]">{message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(id)}
        className={cn(
          "shrink-0 rounded-md p-0.5 " +
            "text-guest-text-muted " +
            "[data-world=staff]_&:text-staff-text-muted " +
            "hover:bg-guest-surface-sunken " +
            "[data-world=staff]_&:hover:bg-staff-surface-sunken " +
            "focus-visible:outline-none " +
            "focus-visible:ring-2 " +
            "focus-visible:ring-ring " +
            "focus-visible:ring-offset-2"
        )}
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

// ---- Toaster ------------------------------------------------------------

interface ToasterProps {
  position?: ToastPosition;
  max?: number;
  children?: ReactNode;
}

export function Toaster({
  position = "bottom-center",
  max = 3,
  children,
}: ToasterProps): JSX.Element {
  return (
    <ToastProvider position={position} max={max}>
      {children}
    </ToastProvider>
  );
}