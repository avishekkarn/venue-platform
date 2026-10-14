"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DrawerProps extends DrawerPrimitive.Root.Props {
  children: ReactNode;
}

function Drawer(props: DrawerProps): JSX.Element {
  return <DrawerPrimitive.Root {...props} />;
}

function DrawerTrigger(
  props: DrawerPrimitive.Trigger.Props
): JSX.Element {
  return <DrawerPrimitive.Trigger {...props} />;
}

type DrawerWorld = "guest" | "staff";

interface DrawerContentProps {
  children: ReactNode;
  className?: string;
  world?: DrawerWorld;
  showClose?: boolean;
}

function DrawerContent({
  children,
  className,
  world = "guest",
  showClose = true,
}: DrawerContentProps): JSX.Element {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-world={world}
        className={cn(
          "fixed inset-0 z-40 bg-neutral-900/40 " +
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 " +
            "transition-opacity " +
            "data-[world=guest]:duration-guest-fast data-[world=guest]:ease-guest-out " +
            "data-[world=staff]:duration-staff-fast data-[world=staff]:ease-staff-out"
        )}
      />
      <DrawerPrimitive.Viewport
        data-world={world}
        className="fixed inset-0 z-50 flex items-end justify-center"
      >
        <DrawerPrimitive.Popup
          data-world={world}
          className={cn(
            "relative w-full max-h-[90vh] " +
              "rounded-t-2xl bg-guest-surface-raised text-guest-text-primary shadow-xl " +
              "[data-world=staff]_&:bg-staff-surface-raised " +
              "[data-world=staff]_&:text-staff-text-primary " +
              "outline-none " +
              "transition-transform " +
              "data-[world=guest]:duration-guest-base data-[world=guest]:ease-guest-in-out " +
              "data-[world=staff]:duration-staff-fast data-[world=staff]:ease-staff-out " +
              "data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
            className
          )}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <span
              className="h-1 w-10 rounded-full bg-guest-border-strong [data-world=staff]_&:bg-staff-border-strong"
              aria-hidden="true"
            />
          </div>
          {showClose ? (
            <DrawerPrimitive.Close
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
            </DrawerPrimitive.Close>
          ) : null}
          {children}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

function DrawerHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("flex flex-col gap-1 px-6 pt-4", className)}>
      {children}
    </div>
  );
}

function DrawerTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <DrawerPrimitive.Title
      className={cn(
        "text-[18px] font-semibold leading-[26px] text-guest-text-primary " +
          "[data-world=staff]_&:text-staff-text-primary",
        className
      )}
    >
      {children}
    </DrawerPrimitive.Title>
  );
}

function DrawerDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <DrawerPrimitive.Description
      className={cn(
        "text-[14px] leading-[20px] text-guest-text-muted " +
          "[data-world=staff]_&:text-staff-text-muted",
        className
      )}
    >
      {children}
    </DrawerPrimitive.Description>
  );
}

function DrawerBody({
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

function DrawerFooter({
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

function DrawerClose(props: DrawerPrimitive.Close.Props): JSX.Element {
  return <DrawerPrimitive.Close {...props} />;
}

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
};