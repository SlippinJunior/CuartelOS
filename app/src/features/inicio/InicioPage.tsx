import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Banknote, CalendarClock, ClipboardCheck, FileText, Package, Plus, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/features/auth/sesion";
import { seccionesDe, SECCIONES } from "@/lib/permisos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SeveridadBadge } from "@/components/common/StatusBadge";
import { formatearFechaHora } from "@/lib/formato";
import { ICONOS } from "@/components/layout/iconos";
import type { PanelInicio } from "@/types/tipos";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function InicioPage() {
  const { data: perfil } = usePerfil();
  const { data: panel, isLoading } = useQuery({
    queryKey: ["panel-inicio"],
    queryFn: async () => {
      const { data, error } = await supabase.schema("nucleo").rpc("panel_inicio");
      if (error) throw error;
      return data as unknown as PanelInicio;
    },
  });

  const roles = perfil?.roles ?? [];
  const secciones = seccionesDe(roles);
  const nombre = perfil?.persona?.nombres ?? perfil?.email ?? "";
  const hoy = new Date();

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm capitalize text-muted-foreground">
          {hoy.getDate()} de {MESES[hoy.getMonth()]} de {hoy.getFullYear()}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {nombre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {perfil?.persona?.rango ? `Bombero ${perfil.persona.rango}` : "Bienvenido/a"} ·{" "}
          {perfil?.compania?.nombre ?? "Segunda Compañía"}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tareas pendientes</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? "…" : (panel?.tareas.length ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Listas por cerrar y solicitudes de material según tu rol.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alertas abiertas</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? "…" : (panel?.alertas.length ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Reglas R01–R12 de los cruces automáticos.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compromisos pendientes</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? "…" : (panel?.compromisos_pendientes ?? 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Tesorería: comprometido o devengado.</CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" /> Tareas y plazos
            </CardTitle>
            <CardDescription>Lo que vence primero según tu rol.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <Skeleton className="h-16 w-full" />}
            {!isLoading && panel?.tareas.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay tareas pendientes. 🟢</p>
            )}
            {panel?.tareas.map((t) => (
              <a
                key={`${t.tipo}-${t.id}`}
                href={t.ruta}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground">Vence {formatearFechaHora(t.vence)}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-aviso" /> Alertas
            </CardTitle>
            <CardDescription>Generadas cada noche por pg_cron.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <Skeleton className="h-16 w-full" />}
            {!isLoading && (panel?.alertas.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Sin alertas visibles para tu rol.</p>
            )}
            {panel?.alertas.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                <SeveridadBadge severidad={a.severidad} />
                <div className="min-w-0">
                  <p className="text-sm">{a.detalle}</p>
                  <p className="text-xs text-muted-foreground">{a.regla}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <TarjetasGuardia panel={panel ?? undefined} />

      <TarjetasMaterial panel={panel ?? undefined} />

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {secciones.includes("asistencia") && (
            <AccesoRapido to="/asistencia" titulo="Pasar lista" icono={ClipboardCheck} />
          )}
          <AccesoRapido to="/guardia" titulo="Guardias" icono={ShieldCheck} />
          <AccesoRapido to="/personal" titulo="Mi hoja de vida" icono={UserRound} />
          <AccesoRapido to="/mis-cuotas" titulo="Mis cuotas" icono={Banknote} />
          {secciones.includes("tesoreria") && (
            <AccesoRapido to="/tesoreria" titulo="Registrar movimiento" icono={Plus} />
          )}
          {secciones.includes("documentos") && (
            <AccesoRapido to="/documentos" titulo="Emitir documento" icono={FileText} />
          )}
          {secciones
            .filter((s) => !["inicio", "personal", "asistencia", "tesoreria", "documentos"].includes(s))
            .slice(0, 4)
            .map((s) => (
              <AccesoRapido key={s} to={SECCIONES[s].ruta} titulo={SECCIONES[s].titulo} icono={ICONOS[s]} />
            ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Sin conexión</Badge>
          Solo el pase de lista funciona sin internet. Las marcas quedan en el dispositivo y se sincronizan al
          reconectar.
        </div>
      </section>
    </div>
  );
}

function AccesoRapido({
  to,
  titulo,
  icono: Icono,
}: {
  to: string;
  titulo: string;
  icono: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-20 flex-col justify-between rounded-lg border border-border bg-card p-3 shadow-suave hover:bg-accent"
    >
      <Icono className="size-5 text-primary" />
      <span className="text-sm font-medium">{titulo}</span>
    </Link>
  );
}

function TarjetasMaterial({ panel }: { panel?: PanelInicio }) {
  const avisos = panel?.notificaciones_material ?? [];
  const pendientes = panel?.solicitudes_material_pendientes ?? 0;

  if (avisos.length === 0 && pendientes === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Package className="size-5 text-primary" /> Pañol del Teniente 2°
        </CardTitle>
        <CardDescription>
          {pendientes > 0
            ? `${pendientes} solicitud${pendientes === 1 ? "" : "es"} por resolver.`
            : "Avisos del pañol y solicitudes de material."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {avisos.slice(0, 4).map((n) => (
          <div key={n.id} className="rounded-md border border-border p-2 text-sm">
            <p className="font-medium">{n.titulo}</p>
            {n.detalle && <p className="text-xs text-muted-foreground">{n.detalle}</p>}
          </div>
        ))}
        <Link to="/material" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          Ir al pañol <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

function TarjetasGuardia({ panel }: { panel?: PanelInicio }) {
  const guardia = panel?.guardia;
  const avisos = panel?.notificaciones_guardia ?? [];
  const firmar = panel?.reportes_por_firmar ?? [];

  if (!guardia && avisos.length === 0 && firmar.length === 0) return null;

  return (
    <section className="grid gap-3 lg:grid-cols-2">
      {guardia?.vinculado && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" /> Tu guardia
            </CardTitle>
            <CardDescription>
              {guardia.exento
                ? "Estás exento de guardia."
                : guardia.pendiente
                  ? "Aún no tienes una guardia inscrita en el ciclo vigente."
                  : `${guardia.cumplidas ?? 0} cumplidas · ${guardia.inscritas ?? 0} inscritas`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            {guardia.exento ? (
              <Badge variant="apagado">⚪ Exento</Badge>
            ) : guardia.pendiente ? (
              <Badge variant="peligro">🔴 Falta inscribirse</Badge>
            ) : (
              <Badge variant="exito">🟢 Al día</Badge>
            )}
            <Badge variant="outline">{guardia.anios_servicio ?? 0} años de servicio</Badge>
            <Link to="/guardia">
              <Button variant="outline" size="sm">Ir a guardias <ArrowRight className="size-3" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {firmar.length > 0 && (
        <Card className="border-aviso/40 bg-aviso/5">
          <CardHeader className="pb-2">
            <CardTitle>Reportes por firmar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {firmar.map((r) => (
              <Link key={r.turno_id} to="/guardia" className="block rounded-md border border-border bg-card p-3 text-sm hover:bg-accent">
                {r.detalle}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {avisos.length > 0 && (
        <Card className="border-aviso/40 bg-aviso/5 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Avisos de guardia</CardTitle>
            <CardDescription>Llegadas tardías y reemplazos sin leer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {avisos.map((n) => (
              <p key={n.id} className="rounded-md border border-border bg-card p-2 text-sm">{n.mensaje}</p>
            ))}
            <Link to="/guardia">
              <Button variant="outline" size="sm">Entendido</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
