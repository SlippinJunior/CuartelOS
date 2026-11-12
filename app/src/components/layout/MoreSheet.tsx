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
      <div className="grid grid-cols-2 gap-2">
        {secciones.map((id) => {
          const seccion = SECCIONES[id];
          const Icono = ICONOS[id];
          return (
            <Link
              key={id}
              to={seccion.ruta}
              onClick={() => onCambio(false)}
              className="flex min-h-20 flex-col justify-between rounded-lg border border-border p-3 hover:bg-accent"
            >
              <Icono className="size-5 text-primary" aria-hidden />
              <span className="text-sm font-medium">{seccion.titulo}</span>
            </Link>
          );
        })}
      </div>
    </Sheet>
  );
}
