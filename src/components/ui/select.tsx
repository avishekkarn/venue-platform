"use client";

import {
  Select as SelectPrimitive,
  type SelectRootProps,
} from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ---- Root ---------------------------------------------------------------
// Wraps the primitive root. All state (open, value, onValueChange) is
// forwarded. The consumer composes with SelectTrigger, SelectValue, etc.

interface SelectProps extends SelectRootProps<unknown, false> {
  children: ReactNode;
}

function Select({ children, ...props }: SelectProps): JSX.Element {
  return <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>;
}

// ---- Trigger ------------------------------------------------------------
// The visible button that opens the menu. Shows the current value and a
// chevron. Uses the same surface, border, and focus ring as Input.

interface SelectTriggerProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  "aria-invalid"?: boolean;
  disabled?: boolean;
}

function SelectTrigger({
  className,
  children,
  id,
  disabled,
  ...props
}: SelectTriggerProps): JSX.Element {
  return (
    <SelectPrimitive.Trigger
      id={id}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 w-full items-center justify-between gap-2 " +
          "rounded-md border bg-clip-padding px-3 " +
          "text-left text-[16px] leading-[24px] " +
          "outline-none transition-none " +
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
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

// ---- Value --------------------------------------------------------------
// Renders the selected item's label inside the trigger, or a placeholder.

interface SelectValueProps {
  placeholder?: string;
}

function SelectValue({ placeholder }: SelectValueProps): JSX.Element {
  return (
    <SelectPrimitive.Value>
      {placeholder ? (
        <span className="text-guest-text-muted [data-world=staff]_&:text-staff-text-muted">
          {placeholder}
        </span>
      ) : null}
    </SelectPrimitive.Value>
  );
}

// ---- Content (menu) -----------------------------------------------------
// The popup. Motion: fade only, 140ms, ease-staff-out (DESIGN.md 4.6.3).

interface SelectContentProps {
  className?: string;
  children: ReactNode;
}

function SelectContent({
  className,
  children,
}: SelectContentProps): JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={4}>
        <SelectPrimitive.Popup
          className={cn(
            "z-50 min-w-[var(--anchor-width)] overflow-hidden rounded-md border " +
              "bg-guest-surface-raised p-1 shadow-md " +
              "border-guest-border-subtle " +
              "[data-world=staff]_&:bg-staff-surface-raised " +
              "[data-world=staff]_&:border-staff-border-subtle " +
              "origin-[var(--transform-origin)] " +
              "transition-opacity " +
              "data-[starting-style]:opacity-0 " +
              "data-[ending-style]:opacity-0 " +
              "duration-staff-fast ease-staff-out",
            className
          )}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

// ---- Item ---------------------------------------------------------------
// One option in the menu. Shows a check mark when selected.

interface SelectItemProps {
  value: string;
  className?: string;
  children: ReactNode;
}

function SelectItem({
  value,
  className,
  children,
}: SelectItemProps): JSX.Element {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 " +
          "rounded-sm px-2 py-1.5 pr-8 " +
          "text-[14px] leading-[20px] " +
          "text-guest-text-primary " +
          "[data-world=staff]_&:text-staff-text-primary " +
          "outline-none " +
          "data-[highlighted]:bg-guest-surface-sunken " +
          "[data-world=staff]_&:data-[highlighted]:bg-staff-surface-sunken",
        className
      )}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex">
        <Check className="size-4" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};