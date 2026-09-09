import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "emerald" | "blue" | "violet" | "orange";
  interactive?: boolean;
}

export function Card({
  className,
  glow = "none",
  interactive = false,
  children,
  ...props
}: CardProps) {
  const glowStyles = {
    none: "",
    emerald: "hover:border-wellness-emerald/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    blue: "hover:border-work-electric-blue/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]",
    violet: "hover:border-learning-violet/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]",
    orange: "hover:border-hobbies-orange/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
  };

  return (
    <div
      className={cn(
        "bg-charcoal-surface border border-white/10 rounded p-4 transition-all duration-200",
        interactive &&
          "cursor-pointer hover:border-white/30 hover:bg-surface-container active:scale-[0.99]",
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
