import * as React from "react";
import { cn } from "@/lib/utils";

const FLECHA_SELECT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2368605b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, style, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full appearance-none rounded-md border border-input bg-card py-2 pl-3 pr-9 text-base shadow-xs",
        "bg-[length:1rem_1rem] bg-[position:right_0.65rem_center] bg-no-repeat",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{ backgroundImage: FLECHA_SELECT, ...style }}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
