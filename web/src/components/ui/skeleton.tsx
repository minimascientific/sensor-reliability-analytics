import * as React from "react";
import { cn } from "@/lib/utils";

// shadcn/ui Skeleton, restyled with this app's tokens.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  );
}

export { Skeleton };
