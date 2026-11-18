import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/** Agrupa rótulo, campo, dica e mensagem de erro com acessibilidade. */
function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | string[];
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-apricot-500" aria-hidden> *</span>}
      </Label>
      {children}
      {message ? (
        <p className="text-sm font-medium text-destructive" role="alert">{message}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export { Field };
