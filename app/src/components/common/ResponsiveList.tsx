import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export interface Columna<T> {
  clave: string;
  titulo: string;
  render: (fila: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  filas: T[];
  columnas: Columna<T>[];
  claveFila: (fila: T) => string | number;
  renderTarjeta?: (fila: T) => React.ReactNode;
  cargando?: boolean;
  vacio?: React.ReactNode;
  alHacerClic?: (fila: T) => void;
  className?: string;
}

/**
 * Lista adaptable: tarjetas en el celular, tabla en el escritorio.
 */
export function ResponsiveList<T>({
  filas,
  columnas,
  claveFila,
  renderTarjeta,
  cargando,
  vacio,
  alHacerClic,
  className,
}: Props<T>) {
  if (cargando) {
    return (
      <div className={cn("space-y-2", className)}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (filas.length === 0) {
    return <>{vacio ?? <EmptyState titulo="Sin registros" descripcion="No hay datos para mostrar con los filtros actuales." />}</>;
  }

  return (
    <div className={className}>
      {/* Celular */}
      <div className="space-y-2 md:hidden">
        {filas.map((fila) => (
          <div
            key={claveFila(fila)}
            className={cn(
              "rounded-lg border border-border bg-card p-4",
              alHacerClic && "cursor-pointer active:bg-muted/60",
            )}
            onClick={() => alHacerClic?.(fila)}
            onKeyDown={(e) => {
              if (alHacerClic && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                alHacerClic(fila);
              }
            }}
            role={alHacerClic ? "button" : undefined}
            tabIndex={alHacerClic ? 0 : undefined}
          >
            {renderTarjeta ? (
              renderTarjeta(fila)
            ) : (
              <dl className="space-y-1">
                {columnas.map((c) => (
                  <div key={c.clave} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-muted-foreground">{c.titulo}</dt>
                    <dd className="text-right text-sm">{c.render(fila)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>

      {/* Escritorio */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columnas.map((c) => (
                <TableHead key={c.clave} className={c.className}>{c.titulo}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila) => (
              <TableRow
                key={claveFila(fila)}
                className={alHacerClic ? "cursor-pointer" : undefined}
                onClick={() => alHacerClic?.(fila)}
              >
                {columnas.map((c) => (
                  <TableCell key={c.clave} className={c.className}>{c.render(fila)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
