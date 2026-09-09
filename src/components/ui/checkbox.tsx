import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  color?: string;
  className?: string;
  size?: "sm" | "md";
}

export function Checkbox({
  checked,
  onChange,
  color = "#10B981",
  className,
  size = "md",
}: CheckboxProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(!checked);
  };

  const dimensions = size === "sm" ? "w-4 h-4 rounded-[3px]" : "w-5 h-5 rounded";
  const iconSize = size === "sm" ? 11 : 14;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={handleClick}
      style={{
        borderColor: checked ? color : "rgba(255, 255, 255, 0.2)",
        backgroundColor: checked ? color : "transparent",
        boxShadow: checked ? `0 0 10px ${color}66` : "none",
      }}
      className={cn(
        "flex items-center justify-center border transition-all duration-200 cursor-pointer shrink-0",
        dimensions,
        !checked && "hover:border-white/40 hover:bg-white/5",
        className
      )}
    >
      {checked && (
        <Check
          size={iconSize}
          className="text-obsidian-deep stroke-[3] animate-in zoom-in-50 duration-150"
        />
      )}
    </button>
  );
}
