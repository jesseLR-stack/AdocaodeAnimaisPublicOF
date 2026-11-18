import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormAlert({ type = "error", children, className }: { type?: "error" | "success" | "info"; children: React.ReactNode; className?: string }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-2xl p-4 text-sm font-medium",
        type === "error" && "bg-red-50 text-red-800 ring-1 ring-red-200",
        type === "success" && "bg-sage-50 text-sage-800 ring-1 ring-sage-200",
        type === "info" && "bg-apricot-100 text-sage-800",
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
