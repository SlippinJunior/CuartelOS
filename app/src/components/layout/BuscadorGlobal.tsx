import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { usePerfil } from "@/features/auth/sesion";
import { esSoloCuartel, seccionesDe, SECCIONES } from "@/lib/permisos";
import { ICONOS } from "@/components/layout/iconos";

export function BuscadorGlobal({ compacto = false }: { compacto?: boolean }) {
  const [abierto, setAbierto] = React.useState(false);
  const navigate = useNavigate();
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const soloCuartel = esSoloCuartel(roles);

  React.useEffect(() => {
    if (soloCuartel) return;
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto((v) => !v);
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [soloCuartel]);

  if (soloCuartel) return null;

  const visibles = seccionesDe(roles);

  function ir(ruta: string) {
    setAbierto(false);
    void navigate({ to: ruta });
  }

  return (
    <>
      {compacto ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Buscar sección"
          title="Buscar (Ctrl+K)"
          onClick={() => setAbierto(true)}
        >
          <Search />
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setAbierto(true)}
          className="w-full justify-between text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" /> Buscar…
          </span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">Ctrl K</kbd>
        </Button>
      )}

      <CommandDialog
        abierto={abierto}
        onCambio={setAbierto}
        title="Buscar en el ERP"
        description="Escribe el nombre de una sección o tarea para ir directo."
      >
        <CommandInput placeholder="Ej: guardia, asistencia, cuotas, secretaría…" />
        <CommandList>
          <CommandEmpty>No encontramos resultados.</CommandEmpty>
          <CommandGroup heading="Secciones disponibles">
            {visibles.map((id) => {
              const s = SECCIONES[id];
              const Icono = ICONOS[id];
              return (
                <CommandItem key={id} value={`${s.titulo} ${s.descripcion}`} onSelect={() => ir(s.ruta)}>
                  <Icono className="size-4 text-primary" aria-hidden />
                  <div className="flex flex-col">
                    <span className="font-medium">{s.titulo}</span>
                    <span className="text-xs text-muted-foreground">{s.descripcion}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
