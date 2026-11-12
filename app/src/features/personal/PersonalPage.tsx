import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, UserRound } from "lucide-react";
import { db } from "@/lib/supabase";
import { usePerfil } from "@/features/auth/sesion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { EstadoBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import { nucleoNormalizar } from "@/lib/texto";
import type { Persona } from "@/types/tipos";

const RANGOS = ["aspirante", "bombero", "honorario", "insigne", "martir"];
const ESTADOS = ["activo", "suspendido", "renunciado", "separado", "expulsado", "fallecido", "trasladado"];

export function PersonalPage() {
  const navigate = useNavigate();
  const { data: perfil } = usePerfil();
  const [busqueda, setBusqueda] = React.useState("");
  const [estado, setEstado] = React.useState("");
  const [rango, setRango] = React.useState("");

  const roles = perfil?.roles ?? [];
  const puedeEscribir = roles.some((r) => ["secretario", "prosecretario", "director", "admin"].includes(r));

  const { data, isLoading, error } = useQuery({
    queryKey: ["personal", "lista"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona")
        .select("id, registro, rut, nombres, apellido_paterno, apellido_materno, rango, estado, email, telefono, fecha_ingreso")
        .order("registro");
      if (error) throw error;
      return (data ?? []) as Persona[];
    },
  });

  const filas = React.useMemo(() => {
    const texto = nucleoNormalizar(busqueda);
    return (data ?? []).filter((p) => {
      if (estado && p.estado !== estado) return false;
      if (rango && p.rango !== rango) return false;
      if (!texto) return true;
      const nombre = nucleoNormalizar(
        `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno ?? ""} ${p.registro} ${p.rut ?? ""}`,
      );
      return nombre.includes(texto);
    });
  }, [data, busqueda, estado, rango]);

  const columnas: Columna<Persona>[] = [
    {
      clave: "registro",
      titulo: "Registro",
      className: "w-24",
      render: (p) => <span className="font-mono text-sm">{p.registro}</span>,
    },
    {
      clave: "nombre",
      titulo: "Nombre",
      render: (p) => (
        <div>
          <p className="font-medium">{p.nombres} {p.apellido_paterno} {p.apellido_materno}</p>
          <p className="text-xs text-muted-foreground">{p.email ?? "Sin correo"}</p>
        </div>
      ),
    },
    { clave: "rango", titulo: "Rango", render: (p) => <span className="capitalize">{p.rango}</span> },
    { clave: "estado", titulo: "Estado", render: (p) => <EstadoBadge estado={p.estado} /> },
    { clave: "ingreso", titulo: "Ingreso", render: (p) => formatearFecha(p.fecha_ingreso) },
  ];

  return (
    <div>
      <PageHeader
        titulo="Personal"
        descripcion="Bomberos, aspirantes y honorarios de la compañía."
        acciones={
          puedeEscribir && (
            <Button onClick={() => void navigate({ to: "/personal/nuevo" })}>
              <Plus /> Nueva persona
            </Button>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-2 pt-4 sm:grid-cols-[1fr_10rem_10rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, registro o RUT"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar persona"
            />
          </div>
          <Select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </Select>
          <Select value={rango} onChange={(e) => setRango(e.target.value)} aria-label="Filtrar por rango">
            <option value="">Todos los rangos</option>
            {RANGOS.map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {error && <p className="mb-3 rounded-md bg-peligro/10 p-3 text-sm text-peligro">{(error as Error).message}</p>}

      <ResponsiveList
        filas={filas}
        columnas={columnas}
        claveFila={(p) => p.id}
        cargando={isLoading}
        alHacerClic={(p) => void navigate({ to: "/personal/$personaId", params: { personaId: p.id } })}
        renderTarjeta={(p) => (
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.nombres} {p.apellido_paterno}</p>
                  <p className="text-xs text-muted-foreground">Registro {p.registro} · {p.rango}</p>
                </div>
                <EstadoBadge estado={p.estado} />
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">{p.email ?? "Sin correo"}</p>
            </div>
          </div>
        )}
        vacio={
          <EmptyState
            titulo="Sin personas"
            descripcion="No hay fichas que coincidan con la búsqueda."
            icono={UserRound}
            accion={
              puedeEscribir ? (
                <Button variant="outline" onClick={() => void navigate({ to: "/personal/nuevo" })}>
                  <Plus /> Crear la primera ficha
                </Button>
              ) : undefined
            }
          />
        }
      />
    </div>
  );
}
