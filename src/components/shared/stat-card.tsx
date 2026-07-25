import { LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  className?: string;
};

export function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm animate-fade-in",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
          {trend && <p className="mt-1 text-xs font-medium text-primary">{trend}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export function MoneyStat({
  title,
  amount,
  currency = "IQD",
  icon,
}: {
  title: string;
  amount: number;
  currency?: string;
  icon: LucideIcon;
}) {
  return <StatCard title={title} value={formatCurrency(amount, currency)} icon={icon} />;
}
