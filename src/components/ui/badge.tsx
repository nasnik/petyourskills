import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "emerald" | "blue" | "violet" | "orange" | "slate" | "danger" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-mono uppercase tracking-wider rounded font-medium transition-colors";

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] leading-4",
    md: "px-2.5 py-1 text-xs leading-4",
  };

  const variants = {
    default: "bg-white/10 text-white border border-white/15",
    emerald: "bg-wellness-emerald/15 text-wellness-emerald border border-wellness-emerald/30",
    blue: "bg-work-electric-blue/15 text-work-electric-blue border border-work-electric-blue/30",
    violet: "bg-learning-violet/15 text-learning-violet border border-learning-violet/30",
    orange: "bg-hobbies-orange/15 text-hobbies-orange border border-hobbies-orange/30",
    slate: "bg-chores-slate/20 text-chores-slate border border-chores-slate/40",
    danger: "bg-danger-red/15 text-danger-red border border-danger-red/30",
    neutral: "bg-surface-container-high text-on-surface-variant border border-white/5",
  };

  return (
    <span
      className={cn(baseStyles, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
