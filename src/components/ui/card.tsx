import type { HTMLAttributes, JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
  selected?: boolean;
}

function Card({
  className,
  children,
  interactive = false,
  selected = false,
  ...props
}: CardProps): JSX.Element {
  return (
    <div
      data-interactive={interactive || undefined}
      data-selected={selected || undefined}
      className={cn(
        // Base — surface, radius, shadow, border.
        "rounded-lg bg-guest-surface-raised text-guest-text-primary shadow-sm " +
          "[data-world=staff]_&:bg-staff-surface-raised " +
          "[data-world=staff]_&:text-staff-text-primary " +
          "border " +
          "border-guest-border-subtle " +
          "[data-world=staff]_&:border-staff-border-subtle " +
          // Selected state — brand border.
          "data-[selected]:border-guest-brand " +
          "[data-world=staff]_&:data-[selected]:border-staff-brand",
        // Interactive — hover-lift in guest world only.
        interactive &&
          "cursor-pointer " +
            "hover:-translate-y-[2px] hover:shadow-md " +
            "transition-[transform,box-shadow] " +
            "duration-guest-fast ease-guest-out " +
            "[data-world=staff]_&:hover:translate-y-0 " +
            "[data-world=staff]_&:hover:shadow-sm " +
            "[data-world=staff]_&:duration-0 " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardSlotProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardMedia({
  className,
  children,
  ...props
}: CardSlotProps): JSX.Element {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-t-lg [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({
  className,
  children,
  ...props
}: CardSlotProps): JSX.Element {
  return (
    <div
      className={cn("flex flex-col gap-1 px-4 pt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
    <h3
      className={cn(
        "text-[18px] font-semibold leading-[24px] " +
          "text-guest-text-primary " +
          "[data-world=staff]_&:text-staff-text-primary",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>): JSX.Element {
  return (
    <p
      className={cn(
        "text-[14px] leading-[20px] " +
          "text-guest-text-muted " +
          "[data-world=staff]_&:text-staff-text-muted",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

function CardBody({
  className,
  children,
  ...props
}: CardSlotProps): JSX.Element {
  return (
    <div className={cn("px-4 py-4", className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({
  className,
  children,
  ...props
}: CardSlotProps): JSX.Element {
  return (
    <div
      className={cn("flex items-center gap-2 px-4 pb-4 pt-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  Card,
  CardMedia,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
};