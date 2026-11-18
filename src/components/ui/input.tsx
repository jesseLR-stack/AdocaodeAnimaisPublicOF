import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldBase =
  "w-full min-w-0 rounded-xl border-2 border-input bg-white px-4 text-[15px] text-foreground shadow-xs transition-[border,box-shadow] outline-none placeholder:text-muted-foreground/70 focus-visible:border-sage-400 focus-visible:ring-4 focus-visible:ring-sage-200/60 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive/70 aria-invalid:ring-destructive/15";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldBase, "h-12", className)} {...props} />;
}

export { Input };
