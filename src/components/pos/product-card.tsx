"use client";

import { Package } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  name: string;
  nameCkb?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  color?: string | null;
  onClick?: () => void;
  disabled?: boolean;
};

export function ProductCard({
  name,
  nameCkb,
  price,
  stock,
  imageUrl,
  color,
  onClick,
  disabled,
}: ProductCardProps) {
  const fmt = useFormatters();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || stock <= 0}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card text-start shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 animate-scale-in"
      )}
    >
      <div
        className="relative flex h-28 items-center justify-center bg-muted/50"
        style={color ? { backgroundColor: `${color}22` } : undefined}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={nameCkb || name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-10 w-10 text-muted-foreground/50 transition-transform group-hover:scale-110" />
        )}
        {stock <= 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm font-bold">
            —
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{nameCkb || name}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-base font-bold text-primary">{fmt.currency(price)}</span>
          <span className="text-xs text-muted-foreground">{fmt.number(stock)}</span>
        </div>
      </div>
    </button>
  );
}
