import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-200",
        className
      )}
    >
      {children}
    </div>
  );
}















interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("p-4 border-b border-slate-200", className)}>{children}</div>
  );
}

export function CardTitle({ children, className }: CardSectionProps) {
  return (
    <h3 className={cn("text-xl font-semibold", className)}>{children}</h3>
  );
}

export function CardDescription({ children, className }: CardSectionProps) {
  return (
    <p className={cn("text-slate-500 text-sm", className)}>{children}</p>
  );
}

export function CardContent({ children, className }: CardSectionProps) {
  return (
    <div className={cn("p-4", className)}>{children}</div>
  );
}

export function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cn("p-4 border-t border-slate-200", className)}>{children}</div>
  );
}














