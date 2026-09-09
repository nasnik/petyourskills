import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "w-full bg-obsidian-deep border border-surface-bright rounded px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors",
            error && "border-danger-red focus:border-danger-red focus:ring-danger-red",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-danger-red font-mono">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
