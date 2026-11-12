import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { usePerfil } from "@/features/auth/sesion";
import { barraInferior, restantesDeBarra, SECCIONES } from "@/lib/permisos";
import { ICONOS } from "@/components/layout/iconos";
import { MoreSheet } from "@/components/layout/MoreSheet";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { data: perfil } = usePerfil();
  const location = useLocation();
  const roles = perfil?.roles ?? [];
  const barra = barraInferior(roles);
  const restantes = restantesDeBarra(roles);
  const [masAbierto, setMasAbierto] = React.useState(false);

  const items = restantes.length > 0 ? barra.slice(0, 3) : barra;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Navegación inferior"
      >
        <div className="grid grid-cols-4">
          {items.map((id) => {
            const seccion = SECCIONES[id];
            const Icono = ICONOS[id];
            const activa = id === "inicio" ? location.pathname === "/" : location.pathname.startsWith(seccion.ruta);
            return (
              <Link
                key={id}
                to={seccion.ruta}
                className={cn(
                  "flex min-h-[var(--alto-barra-inferior)] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                  activa ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icono className="size-5" aria-hidden />
                <span className="truncate">{seccion.titulo}</span>
              </Link>
            );
          })}
          {restantes.length > 0 && (
            <button
              type="button"
              onClick={() => setMasAbierto(true)}
              className="flex min-h-[var(--alto-barra-inferior)] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground"
            >
              <Menu className="size-5" aria-hidden />
              <span>Más</span>
            </button>
          )}
        </div>
      </nav>
      <MoreSheet abierto={masAbierto} onCambio={setMasAbierto} secciones={restantes} />
    </>
  );
}
