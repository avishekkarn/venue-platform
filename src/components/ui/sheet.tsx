"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SheetProps extends DialogPrimitive.Root.Props {
  children: ReactNode;
}

function Sheet(props: SheetProps): JSX.Element {
  return <DialogPrimitive.Root {...props} />;
}

function SheetTrigger(
  props: DialogPrimitive.Trigger.Props
): JSX.Element {
  return <DialogPrimitive.Trigger {...props} />;
}

type SheetSide = "right" | "bottom";
type SheetWorld = "guest" | "staff";

interface SheetContentProps {
  children: ReactNode;
  className?: string;
  side?: SheetSide;
  world?: SheetWorld;
  showClose?: boolean;
}

const sideClasses: Record<SheetSide, string> = {
  right:
    "fixed right-0 top-0 z-50 h-full w-full max-w-[480px] " +
    "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
  bottom:
    "fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] w-full " +
    "data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
};

function SheetContent({
  children,
  className,
  side = "right",
  world = "guest",
  showClose = true,
}: SheetContentProps): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-world={world}
        className={cn(
          "fixed inset-0 z-40 bg-neutral-900/40 " +
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 " +
            "transition-opacity " +
            "data-[world=guest]:duration-guest-fast data-[world=guest]:ease-guest-out " +
            "data-[world=staff]:duration-staff-fast data-[world=staff]:ease-staff-out"
        )}
      />
      <DialogPrimitive.Popup
        data-world={world}
        className={cn(
          "bg-guest-surface-raised text-guest-text-primary shadow-xl " +
            "[data-world=staff]_&:bg-staff-surface-raised " +
            "[data-world=staff]_&:text-staff-text-primary " +
            "outline-none " +
            "transition-transform " +
            "data-[world=guest]:duration-guest-base data-[world=guest]:ease-guest-in-out " +
            "data-[world=staff]:duration-staff-fast data-[world=staff]:ease-staff-out " +
            sideClasses[side],
          className
        )}
      >
        {showClose ? (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-3 top-3 inline-flex size-8 items-center justify-center " +
                "rounded-md text-guest-text-muted " +
                "[data-world=staff]_&:text-staff-text-muted " +
                "hover:bg-guest-surface-sunken " +
                "[data-world=staff]_&:hover:bg-staff-surface-sunken " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        ) : null}
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("flex flex-col gap-1 px-6 pt-6", className)}>
      {children}
    </div>
  );
}

function SheetTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-[18px] font-semibold leading-[26px] text-guest-text-primary " +
          "[data-world=staff]_&:text-staff-text-primary",
        className
      )}
    >
      {children}
    </DialogPrimitive.Title>
  );
}

function SheetDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <DialogPrimitive.Description
      className={cn(
        "text-[14px] leading-[20px] text-guest-text-muted " +
          "[data-world=staff]_&:text-staff-text-muted",
        className
      )}
    >
      {children}
    </DialogPrimitive.Description>
  );
}

function SheetBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("overflow-y-auto px-6 py-4", className)}>
      {children}
    </div>
  );
}

function SheetFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("flex justify-end gap-2 px-6 pb-6 pt-2", className)}>
      {children}
    </div>
  );
}

function SheetClose(props: DialogPrimitive.Close.Props): JSX.Element {
  return <DialogPrimitive.Close {...props} />;
}

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetClose,
};