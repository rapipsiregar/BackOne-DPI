import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/80 backdrop-blur-xl text-card-foreground shadow-sm hover:shadow-primary/5 hover:border-primary/20 transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-3.5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-3.5 pt-0 sm:p-6 sm:pt-0", className)}>{children}</div>
  );
}
