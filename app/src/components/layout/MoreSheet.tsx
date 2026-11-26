import { Link } from "@tanstack/react-router";
import { Sheet } from "@/components/ui/sheet";
import { TextoToggle } from "@/components/layout/TextoToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SECCIONES, type Seccion } from "@/lib/permisos";
import { ICONOS } from "@/components/layout/iconos";

export function MoreSheet({
  abierto,
  onCambio,
  secciones,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  secciones: Seccion[];
}) {
  return (
    <Sheet abierto={abierto} onCambio={onCambio} titulo="Más secciones">
      <div className="grid gap-1 sm:grid-cols-2">
        {secciones.map((id) => {
          const seccion = SECCIONES[id];
          const Icono = ICONOS[id];
          return (
            <Link
              key={id}
              to={seccion.ruta}
              onClick={() => onCambio(false)}
              className="flex min-h-12 min-w-0 items-center gap-3 overflow-hidden rounded-lg border border-border bg-card p-2 hover:bg-accent"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icono className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight">{seccion.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{seccion.descripcion}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-2.5 sm:hidden">
        <span className="text-sm font-medium text-muted-foreground">Tamaño de texto y tema</span>
        <div className="flex items-center gap-1">
          <TextoToggle />
          <ThemeToggle />
        </div>
      </div>
    </Sheet>
  );
}
