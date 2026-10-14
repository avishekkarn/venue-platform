"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DialogProps extends DialogPrimitive.Root.Props {
  children: ReactNode;
}

function Dialog(props: DialogProps): JSX.Element {
  return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger(
  props: DialogPrimitive.Trigger.Props
): JSX.Element {
  return <DialogPrimitive.Trigger {...props} />;
}

type DialogSize = "sm" | "md" | "lg";
type DialogWorld = "guest" | "staff";

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  size?: DialogSize;
  world?: DialogWorld;
  showClose?: boolean;
}

const sizeMaxWidth: Record<DialogSize, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
};

function DialogContent({
  children,
  className,
  size = "md",
  world = "guest",
  showClose = true,
}: DialogContentProps): JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-40 bg-neutral-900/40 " +
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 " +
            "transition-opacity " +
            "data-[world=guest]:duration-guest-fast data-[world=guest]:ease-guest-out " +
            "data-[world=staff]:duration-staff-fast data-[world=staff]:ease-staff-out"
        )}
        data-world={world}
      />
      <DialogPrimitive.Popup
        data-world={world}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
            "w-[calc(100vw-2rem)] rounded-lg shadow-xl " +
            "bg-guest-surface-raised text-guest-text-primary " +
            "[data-world=staff]_&:bg-staff-surface-raised " +
            "[data-world=staff]_&:text-staff-text-primary " +
            "outline-none " +
            "data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.96] " +
            "data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.96] " +
            "transition-[opacity,transform] " +
            "data-[world=guest]:duration-guest-base data-[world=guest]:ease-guest-out " +
            "data-[world=staff]:duration-staff-fast data-[world=staff]:ease-staff-out " +
            sizeMaxWidth[size],
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

function DialogHeader({
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

function DialogTitle({
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

function DialogDescription({
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

function DialogBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

function DialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        "flex justify-end gap-2 px-6 pb-6 pt-2",
        className
      )}
    >
      {children}
    </div>
  );
}

function DialogClose(
  props: DialogPrimitive.Close.Props
): JSX.Element {
  return <DialogPrimitive.Close {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
};