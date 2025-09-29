import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { clsx } from "clsx";

type TabsProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;

type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;

type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;

type TabsContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={clsx("inline-flex h-10 items-center gap-1", className)} {...props} />
  )
);
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
        "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:bg-gray-100",
        className
      )}
      {...props}
    />
  )
);
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={clsx("mt-4 rounded-md border border-gray-200 bg-white p-4", className)}
      {...props}
    />
  )
);
TabsContent.displayName = "TabsContent";
