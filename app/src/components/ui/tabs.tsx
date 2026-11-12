import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  etiqueta: string;
  contenido: React.ReactNode;
}

export function Tabs({
  items,
  inicial,
  value,
  onValueChange,
  className,
}: {
  items: TabItem[];
  inicial?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  className?: string;
}) {
  const [interno, setInterno] = React.useState(inicial ?? items[0]?.id);
  const activo = value ?? interno;
  const actual = items.find((i) => i.id === activo) ?? items[0];

  const cambiar = (id: string) => {
    setInterno(id);
    onValueChange?.(id);
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Secciones"
        className="flex gap-1 overflow-x-auto border-b border-border pb-0"
      >
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={item.id === actual?.id}
            aria-controls={`tab-${item.id}`}
            onClick={() => cambiar(item.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-t-md px-3 py-2 text-sm font-medium text-muted-foreground",
              "border-b-2 border-transparent hover:text-foreground",
              item.id === actual?.id && "border-primary text-primary",
            )}
          >
            {item.etiqueta}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`tab-${actual?.id}`} className="pt-4">
        {actual?.contenido}
      </div>
    </div>
  );
}
