import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "red" | "orange" | "yellow" | "green" | "blue" | "cyan";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-primary/20 bg-primary/10 text-primary": variant === "default",
          "border-red-500/20 bg-red-500/10 text-red-500": variant === "red",
          "border-orange-500/20 bg-orange-500/10 text-orange-500": variant === "orange",
          "border-yellow-500/20 bg-yellow-500/10 text-yellow-500": variant === "yellow",
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-500": variant === "green",
          "border-blue-500/20 bg-blue-500/10 text-blue-500": variant === "blue",
          "border-cyan-500/20 bg-cyan-500/10 text-cyan-500": variant === "cyan",
        },
        className
      )}
      {...props}
    />
  );
}
