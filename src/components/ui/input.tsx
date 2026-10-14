import type { InputHTMLAttributes, JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helper?: string;
  label?: ReactNode;
}

function Input({
  className,
  error,
  helper,
  label,
  id,
  disabled,
  ...props
}: InputProps): JSX.Element {
  // aria-describedby links the input to whichever of helper / error is present.
  // If both are present, error wins visually; helper stays in the DOM for
  // reference but is not shown (the error is the actionable message).
  const describedBy = error
    ? `${id}-error`
    : helper
      ? `${id}-helper`
      : undefined;

  const input = (
    <input
      id={id}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={cn(
        // Base shape
        "block w-full rounded-md border bg-clip-padding " +
          // Typography — same in both worlds per DESIGN.md 4.6.2
          "text-[16px] leading-[24px] " +
          // Padding that fits md (40px) height
          "px-3 py-2 " +
          // Transitions are disabled (motion: none per 4.6.2)
          "outline-none transition-none " +
          // Placeholder color
          "placeholder:text-guest-text-muted " +
          "[data-world=staff]_&:placeholder:text-staff-text-muted " +
          // Base surface / border / text — world-scoped
          "bg-guest-surface-raised text-guest-text-primary " +
          "border-guest-border-subtle " +
          "[data-world=staff]_&:bg-staff-surface-raised " +
          "[data-world=staff]_&:text-staff-text-primary " +
          "[data-world=staff]_&:border-staff-border-subtle " +
          // Focus: 2px border in brand color, no shadow (4.6.2)
          "focus:border-ring focus:ring-0 " +
          "focus-visible:outline-none " +
          // Error: border in --color-status-cancelled
          "aria-[invalid=true]:border-status-cancelled " +
          // Disabled: sunken surface, muted text (4.6.2)
          "disabled:cursor-not-allowed " +
          "disabled:bg-guest-surface-sunken disabled:text-guest-text-muted " +
          "[data-world=staff]_&:disabled:bg-staff-surface-sunken " +
          "[data-world=staff]_&:disabled:text-staff-text-muted",
        className
      )}
      {...props}
    />
  );

  // If no id is provided, we cannot wire aria-describedby. Callers using the
  // field in a form should always pass an id. If a label is provided without an
  // id, we render the label without htmlFor — degraded but not broken.
  if (!label && !helper && !error) {
    return input;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "select-none text-[13px] font-semibold leading-[18px] " +
              "text-guest-text-secondary " +
              "[data-world=staff]_&:text-staff-text-secondary",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {label}
        </label>
      ) : null}

      {input}

      {error ? (
        <p
          id={`${id}-error`}
          className="text-[13px] leading-[18px] text-status-cancelled"
        >
          {error}
        </p>
      ) : helper ? (
        <p
          id={`${id}-helper`}
          className={cn(
            "text-[13px] leading-[18px] " +
              "text-guest-text-muted " +
              "[data-world=staff]_&:text-staff-text-muted"
          )}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export { Input };