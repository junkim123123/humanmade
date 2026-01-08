import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "default" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export function Button({
  children,
  variant = "default",
  size = "md",
  className,
  asChild,
  ...props
}: ButtonProps) {
  // Remove asChild from props to prevent it from being passed to DOM
  const { asChild: _, ...buttonProps } = props as any;
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        variant === "outline" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" && "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900",
        variant === "default" && "bg-electric-blue-600 text-white hover:bg-electric-blue-700",
        size === "sm" && "px-3 py-1.5 text-sm h-10",
        size === "md" && "px-4 py-2 text-base h-12",
        size === "lg" && "px-6 py-3 text-lg h-12",
        size === "icon" && "h-10 w-10 p-0",
        className
      )}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

