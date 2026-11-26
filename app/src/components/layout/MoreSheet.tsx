import { Link } from "@tanstack/react-router";
import { Sheet } from "@/components/ui/sheet";
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
      <div className="grid gap-2 sm:grid-cols-2">
        {secciones.map((id) => {
          const seccion = SECCIONES[id];
          const Icono = ICONOS[id];
          return (
            <Link
              key={id}
              to={seccion.ruta}
              onClick={() => onCambio(false)}
              className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icono className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold leading-tight">{seccion.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{seccion.descripcion}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Sheet>
  );
}
