import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  containerClassName?: string;
  onLimpiar?: () => void;
}

/**
 * Campo de búsqueda con lupa centrada verticalmente y botón opcional para limpiar.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, value, onLimpiar, ...props }, ref) => {
    const tieneTexto = typeof value === "string" ? value.length > 0 : Boolean(value);

    return (
      <div className={cn("relative flex w-full items-center", containerClassName)}>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={ref}
          type="text"
          inputMode="search"
          value={value}
          className={cn("pl-10", tieneTexto && onLimpiar ? "pr-10" : "", className)}
          {...props}
        />
        {tieneTexto && onLimpiar && (
          <button
            type="button"
            onClick={onLimpiar}
            aria-label="Limpiar búsqueda"
            className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
