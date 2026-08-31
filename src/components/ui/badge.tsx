import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold",
        secondary:
          "border-[#27272a] bg-[#18181b] text-zinc-300 hover:bg-[#27272a]",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-400 font-bold",
        outline: "text-zinc-300 border-[#27272a] bg-transparent",
        food: "border-orange-500/30 bg-orange-500/10 text-orange-300",
        transport: "border-blue-500/30 bg-blue-500/10 text-blue-300",
        shopping: "border-purple-500/30 bg-purple-500/10 text-purple-300",
        bills: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        health: "border-rose-500/30 bg-rose-500/10 text-rose-300",
        entertainment: "border-pink-500/30 bg-pink-500/10 text-pink-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function getCategoryBadgeVariant(category: string): "food" | "transport" | "shopping" | "bills" | "health" | "entertainment" | "default" {
  const cat = category.toLowerCase();
  if (cat.includes("makan") || cat.includes("minum") || cat.includes("kopi") || cat.includes("kuliner")) return "food";
  if (cat.includes("transport") || cat.includes("bensin") || cat.includes("gojek") || cat.includes("grab") || cat.includes("parkir") || cat.includes("oli")) return "transport";
  if (cat.includes("belanja") || cat.includes("kebutuhan") || cat.includes("supermarket")) return "shopping";
  if (cat.includes("tagihan") || cat.includes("listrik") || cat.includes("pln") || cat.includes("internet") || cat.includes("pulsa") || cat.includes("air")) return "bills";
  if (cat.includes("sehat") || cat.includes("obat") || cat.includes("dokter") || cat.includes("apotek")) return "health";
  if (cat.includes("hiburan") || cat.includes("game") || cat.includes("bioskop") || cat.includes("nonton")) return "entertainment";
  return "default";
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "food" | "transport" | "shopping" | "bills" | "health" | "entertainment" | null;
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant: variant || "default" }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
