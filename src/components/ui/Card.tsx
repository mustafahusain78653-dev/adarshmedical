import { cn } from "@/lib/ui";

export function Card({
  className,
  children,
}: Readonly<{ className?: string; children: React.ReactNode }>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: Readonly<{ className?: string; children: React.ReactNode }>) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function CardTitle({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="text-sm font-semibold">{children}</div>;
}

export function CardContent({
  className,
  children,
}: Readonly<{ className?: string; children: React.ReactNode }>) {
  return <div className={cn("p-4 pt-0", className)}>{children}</div>;
}



