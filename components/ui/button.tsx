import * as React from "react";
import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--rp-primary)] text-white shadow-sm hover:bg-[var(--rp-primary-hover)] focus-visible:ring-[var(--rp-primary)]",
        secondary:
          "bg-white/10 text-white border border-white/20 hover:bg-white/20 focus-visible:ring-white",
        ghost:
          "text-[var(--rp-ink)] hover:bg-[var(--rp-surface)] focus-visible:ring-[var(--rp-primary)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({className, variant, size, ...props}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({variant, size, className}))}
      {...props}
    />
  );
}
