import type { TextareaHTMLAttributes, JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helper?: string;
  label?: ReactNode;
}

function Textarea({
  className,
  error,
  helper,
  label,
  id,
  disabled,
  ...props
}: TextareaProps): JSX.Element {
  const describedBy = error
    ? `${id}-error`
    : helper
      ? `${id}-helper`
      : undefined;

  const field = (
    <textarea
      id={id}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={cn(
        "block w-full rounded-md border bg-clip-padding " +
          "text-[16px] leading-[24px] " +
          "px-3 py-2 " +
          "outline-none transition-none " +
          "resize-y " +
          "placeholder:text-guest-text-muted " +
          "[data-world=staff]_&:placeholder:text-staff-text-muted " +
          "bg-guest-surface-raised text-guest-text-primary " +
          "border-guest-border-subtle " +
          "[data-world=staff]_&:bg-staff-surface-raised " +
          "[data-world=staff]_&:text-staff-text-primary " +
          "[data-world=staff]_&:border-staff-border-subtle " +
          "focus:border-ring focus:ring-0 " +
          "focus-visible:outline-none " +
          "aria-[invalid=true]:border-status-cancelled " +
          "disabled:cursor-not-allowed " +
          "disabled:bg-guest-surface-sunken disabled:text-guest-text-muted " +
          "[data-world=staff]_&:disabled:bg-staff-surface-sunken " +
          "[data-world=staff]_&:disabled:text-staff-text-muted",
        className
      )}
      {...props}
    />
  );

  if (!label && !helper && !error) {
    return field;
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

      {field}

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

export { Textarea };