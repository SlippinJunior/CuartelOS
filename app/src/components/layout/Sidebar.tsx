import { Link, useLocation } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useSesion, usePerfil } from "@/features/auth/sesion";
import { GRUPOS_NAVEGACION, seccionesDe, SECCIONES, etiquetaRol } from "@/lib/permisos";
import { ICONOS } from "@/components/layout/iconos";
import { BuscadorGlobal } from "@/components/layout/BuscadorGlobal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { data: perfil } = usePerfil();
  const { salir } = useSesion();
  const location = useLocation();
  const roles = perfil?.roles ?? [];
  const visibles = new Set(seccionesDe(roles, perfil?.modulos));

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-[var(--ancho-sidebar)] flex-col border-r border-border bg-card lg:flex"
      aria-label="Navegación principal"
    >
      <div className="flex items-center gap-3 border-b border-border p-4">
        <img src="/escudo.png" alt="" className="size-10 object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight">Segunda Compañía</p>
          <p className="truncate text-xs text-muted-foreground">{perfil?.compania?.cuerpo ?? "Cuerpo de Bomberos"}</p>
        </div>
      </div>

      <div className="border-b border-border p-3">
        <BuscadorGlobal />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {GRUPOS_NAVEGACION.map((grupo) => {
          const items = grupo.secciones.filter((s) => visibles.has(s));
          if (items.length === 0) return null;
          return (
            <div key={grupo.titulo} className="space-y-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {grupo.titulo}
              </p>
              {items.map((id) => {
                const seccion = SECCIONES[id];
                const Icono = ICONOS[id];
                const activa = id === "inicio" ? location.pathname === "/" : location.pathname.startsWith(seccion.ruta);
                return (
                  <Link
                    key={id}
                    to={seccion.ruta}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors",
                      activa
                        ? "bg-primary/12 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icono className="size-5 shrink-0" aria-hidden />
                    <span className="truncate">{seccion.titulo}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <p className="truncate px-2 text-sm font-medium">{perfil?.persona?.nombre ?? perfil?.email ?? "Sin persona"}</p>
        <p className="truncate px-2 text-xs text-muted-foreground">
          {roles.map(etiquetaRol).join(" · ") || "Sin rol"}
        </p>
        <Button variant="ghost" className="mt-2 w-full justify-start" onClick={() => void salir()}>
          <LogOut /> Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
