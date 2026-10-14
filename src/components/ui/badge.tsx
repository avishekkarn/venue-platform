import type { HTMLAttributes, JSX, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Base — shape, typography, layout. Colors come from the variant.
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 " +
    "text-[12px] font-medium leading-[16px] whitespace-nowrap select-none " +
    "transition-colors duration-guest-base ease-guest-out " +
    "[data-world=staff]_&:duration-0",
  {
    variants: {
      variant: {
        // Semantic status colors. Foreground = status, background = status-bg.
        status:
          "bg-status-waiting-bg text-status-waiting " +
          "data-[status=active]:bg-status-active-bg data-[status=active]:text-status-active " +
          "data-[status=ready]:bg-status-ready-bg data-[status=ready]:text-status-ready " +
          "data-[status=done]:bg-status-done-bg data-[status=done]:text-status-done " +
          "data-[status=cancelled]:bg-status-cancelled-bg data-[status=cancelled]:text-status-cancelled",
        // Neutral — a quiet chip. Uses world-scoped subtle surfaces.
        neutral:
          "bg-guest-surface-sunken text-guest-text-secondary " +
          "[data-world=staff]_&:bg-staff-surface-sunken " +
          "[data-world=staff]_&:text-staff-text-secondary",
        // Brand — the venue's color, used sparingly.
        brand:
          "bg-guest-brand-muted text-guest-brand " +
          "[data-world=staff]_&:bg-staff-surface-sunken " +
          "[data-world=staff]_&:text-staff-brand",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

type BadgeStatus = "waiting" | "active" | "ready" | "done" | "cancelled";

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode;
  dot?: boolean;
  status?: BadgeStatus;
}

function Badge({
  className,
  variant = "neutral",
  dot = false,
  status,
  children,
  ...props
}: BadgeProps): JSX.Element {
  return (
    <span
      data-status={status}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current"
        />
      ) : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
export type { BadgeStatus };