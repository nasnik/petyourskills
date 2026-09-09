import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "domain";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none rounded cursor-pointer";

    const variants = {
      primary: "bg-white text-obsidian-deep hover:bg-white/90 active:scale-[0.98]",
      secondary:
        "bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/5 active:scale-[0.98]",
      ghost: "text-on-surface hover:bg-white/5 hover:text-white",
      danger: "bg-danger-red/20 text-danger-red border border-danger-red/40 hover:bg-danger-red/30",
      domain: "bg-wellness-emerald/15 text-wellness-emerald hover:bg-wellness-emerald/25 border border-wellness-emerald/30",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
