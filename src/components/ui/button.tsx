import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base — shape, focus ring, disabled state, icon sizing. No color,
  // no motion. Those are set by variants and by app/globals.css.
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 " +
    "rounded-md border border-transparent bg-clip-padding " +
    "font-medium whitespace-nowrap select-none " +
    "outline-none " +
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring " +
    "disabled:pointer-events-none disabled:opacity-40 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 " +
    "[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Guest world: brand background, inverse text.
        // Staff world: staff-brand background, inverse text.
        // Which color resolves is decided by [data-world] in globals.css.
        primary:
          "bg-guest-brand text-guest-brand-contrast hover:brightness-95 " +
          "[data-world=staff]_&:bg-staff-brand " +
          "[data-world=staff]_&:text-staff-brand-contrast",

        // Outlined button. Uses world-specific border and hover surface.
        secondary:
          "border-guest-border-strong bg-transparent text-guest-text-primary " +
          "hover:bg-guest-surface-sunken " +
          "[data-world=staff]_&:border-staff-border-strong " +
          "[data-world=staff]_&:text-staff-text-primary " +
          "[data-world=staff]_&:hover:bg-staff-surface-sunken",

        // No border, no background, only hover feedback.
        ghost:
          "bg-transparent text-guest-text-primary hover:bg-guest-surface-sunken " +
          "[data-world=staff]_&:text-staff-text-primary " +
          "[data-world=staff]_&:hover:bg-staff-surface-sunken",

        // Destructive actions. Uses the status-cancelled token pair.
        danger:
          "bg-status-cancelled-bg text-status-cancelled hover:brightness-95",
      },
      size: {
        sm: "h-8 px-2.5 text-sm",
        md: "h-10 px-3.5 text-sm",
        lg: "h-[52px] px-5 text-base",
        xl: "h-[60px] px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <span aria-hidden="true" className="inline-flex items-center gap-1">
          <span className="size-1 rounded-full bg-current animate-pulse" />
          <span className="size-1 rounded-full bg-current animate-pulse [animation-delay:150ms]" />
          <span className="size-1 rounded-full bg-current animate-pulse [animation-delay:300ms]" />
        </span>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };