import type { LabelHTMLAttributes, JSX } from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

function Label({ className, children, ...props }: LabelProps): JSX.Element {
  return (
    <label
      className={cn(
        // Base
        "inline-block select-none " +
          // World-scoped text color: guest uses the sand world's muted text,
          // staff uses the neutral world's secondary text.
          "text-guest-text-secondary " +
          "[data-world=staff]_&:text-staff-text-secondary " +
          // Label sizing (DESIGN.md 4.3.2 --guest-text-label / 4.3.3 --staff-text-label)
          "text-[13px] font-semibold leading-[18px] " +
          // Disabled peer state: when the sibling input is disabled, dim the label.
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export { Label };