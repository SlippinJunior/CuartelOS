import * as React from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  FileText,
  History,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { db } from "@/lib/supabase";
import { usePerfil } from "@/features/auth/sesion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { SemaforoBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha, formatearPorcentaje } from "@/lib/formato";
import {
  DialogoCargo,
  DialogoCurso,
  DialogoEvento,
  DialogoLicencia,
  DialogoPremio,
  DialogoSensible,
} from "@/features/personal/dialogos";
import { DialogoAbono, DialogoAntiguedad, TarjetaAntiguedad, useAntiguedad } from "@/features/personal/antiguedad";
import type {
  AntiguedadPersona,
  Asignacion,
  AsistenciaPersona,
  CargoPeriodo,
  DatoSensible,
  DocumentoEmitido,
  LicenciaConducir,
  Persona,
  PersonaCurso,
  PersonaEvento,
  PersonaPremio,
  SituacionEspecial,
} from "@/types/tipos";

export function PersonaPage() {
  const { personaId } = useParams({ strict: false }) as { personaId: string };
  const navigate = useNavigate();
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeEscribir = roles.some((r) => ["secretario", "prosecretario", "director", "admin"].includes(r));
  const esPropia = perfil?.persona?.id === personaId;
  const esOficial = perfil?.es_oficial ?? false;
  const puedeLeerSensible = esOficial || esPropia;
  const puedeSensible = puedeEscribir || esPropia;
  const puedeAjustarAntiguedad = roles.some((r) => ["director", "secretario", "admin"].includes(r));
  const antiguedadQ = useAntiguedad(personaId);

  const [dialogo, setDialogo] = React.useState<
    "evento" | "cargo" | "curso" | "premio" | "licencia" | "sensible" | "antiguedad" | "abono" | null
  >(null);

  const personaQ = useQuery({
    queryKey: ["persona", personaId],
    queryFn: async () => {
      const { data, error } = await db.personal.from("persona").select("*").eq("id", personaId).single();
      if (error) throw error;
      return data as Persona;
    },
  });

  const cargosQ = useQuery({
    queryKey: ["persona", personaId, "cargos"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("cargo_periodo")
        .select("*, cargo:cargo(*)")
        .eq("persona_id", personaId)
        .order("desde", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CargoPeriodo[];
    },
  });

  const cursosQ = useQuery({
    queryKey: ["persona", personaId, "cursos"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona_curso")
        .select("*, curso:curso(*)")
        .eq("persona_id", personaId)
        .order("fecha_aprobacion", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PersonaCurso[];
    },
  });

  const premiosQ = useQuery({
    queryKey: ["persona", personaId, "premios"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona_premio")
        .select("*, premio_tipo:premio_tipo(*)")
        .eq("persona_id", personaId)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PersonaPremio[];
    },
  });

  const eventosQ = useQuery({
    queryKey: ["persona", personaId, "eventos"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona_evento")
        .select("*")
        .eq("persona_id", personaId)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PersonaEvento[];
    },
  });

  const situacionesQ = useQuery({
    queryKey: ["persona", personaId, "situaciones"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("situacion_especial")
        .select("*")
        .eq("persona_id", personaId)
        .order("desde", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SituacionEspecial[];
    },
  });

  const licenciasQ = useQuery({
    queryKey: ["persona", personaId, "licencias"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("licencia_conducir")
        .select("*")
        .eq("persona_id", personaId);
      if (error) throw error;
      return (data ?? []) as LicenciaConducir[];
    },
  });

  const materialQ = useQuery({
    queryKey: ["persona", personaId, "material"],
    queryFn: async () => {
      const { data, error } = await db.material
        .from("asignacion")
        .select("*, articulo:articulo(*)")
        .eq("persona_id", personaId)
        .order("fecha_entrega", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Asignacion[];
    },
  });

  const asistenciaQ = useQuery({
    queryKey: ["persona", personaId, "asistencia"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("v_asistencia_persona")
        .select("*")
        .eq("persona_id", personaId);
      if (error) throw error;
      return (data ?? []) as AsistenciaPersona[];
    },
  });

  const documentosQ = useQuery({
    queryKey: ["persona", personaId, "documentos"],
    queryFn: async () => {
      const { data, error } = await db.documentos
        .from("documento_emitido")
        .select("*")
        .eq("persona_id", personaId)
        .order("emitido_en", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentoEmitido[];
    },
  });

  const sensibleQ = useQuery({
    queryKey: ["sensible", personaId],
    queryFn: async () => {
      const { data, error } = await db.personal.rpc("leer_dato_sensible", { p_persona_id: personaId });
      if (error) throw error;
      return data as unknown as DatoSensible | null;
    },
    enabled: puedeLeerSensible,
    retry: false,
  });

  if (personaQ.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (personaQ.isError || !personaQ.data) {
    return (
      <EmptyState
        titulo="Ficha no disponible"
        descripcion="No existe o no tienes permiso para verla."
        icono={UserRound}
        accion={<Button variant="outline" onClick={() => void navigate({ to: "/personal" })}>Volver a Personal</Button>}
      />
    );
  }

  const p = personaQ.data;
  const nombre = `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno ?? ""}`.trim();
  const actual = asistenciaQ.data?.find((a) => a.anio === new Date().getFullYear()) ?? asistenciaQ.data?.[0];

  return (
    <div>
      <PageHeader
        titulo={nombre}
        descripcion={`Registro ${p.registro} · ${p.rango} · ${p.estado}`}
        volverA="/personal"
        acciones={
          <>
            {puedeEscribir && (
              <Button
                variant="outline"
                onClick={() =>
                  void navigate({ to: "/personal/$personaId/editar", params: { personaId } })
                }
              >
                Editar ficha
              </Button>
            )}
            <Button
              onClick={() =>
                void navigate({
                  to: "/documentos/emitir",
                  search: { persona: personaId } as never,
                })
              }
            >
              <FileText /> Emitir hoja de vida
            </Button>
          </>
        }
      />

      <Tabs
        items={[
          {
            id: "resumen",
            etiqueta: "Resumen",
            contenido: (
              <Resumen
                persona={p}
                antiguedad={antiguedadQ.data}
                situaciones={situacionesQ.data ?? []}
                eventos={eventosQ.data ?? []}
                licencias={licenciasQ.data ?? []}
                puedeEscribir={puedeEscribir}
                puedeAjustarAntiguedad={puedeAjustarAntiguedad}
                alAgregarEvento={() => setDialogo("evento")}
                alAgregarLicencia={() => setDialogo("licencia")}
                alAjustarAntiguedad={() => setDialogo("antiguedad")}
              />
            ),
          },
          {
            id: "asistencia",
            etiqueta: "Asistencia",
            contenido: <AsistenciaTab actual={actual} />,
          },
          {
            id: "cargos",
            etiqueta: "Cargos",
            contenido: (
              <CargosTab
                cargos={cargosQ.data ?? []}
                puedeEscribir={puedeEscribir}
                alAgregar={() => setDialogo("cargo")}
              />
            ),
          },
          {
            id: "formacion",
            etiqueta: "Formación",
            contenido: (
              <FormacionTab
                cursos={cursosQ.data ?? []}
                puedeEscribir={puedeEscribir}
                alAgregar={() => setDialogo("curso")}
              />
            ),
          },
          {
            id: "premios",
            etiqueta: "Premios",
            contenido: (
              <PremiosTab
                premios={premiosQ.data ?? []}
                puedeEscribir={puedeEscribir}
                alAgregar={() => setDialogo("premio")}
                alAgregarAbono={() => setDialogo("abono")}
              />
            ),
          },
          {
            id: "material",
            etiqueta: "Material",
            contenido: <MaterialTab material={materialQ.data ?? []} />,
          },
          {
            id: "documentos",
            etiqueta: "Documentos",
            contenido: <DocumentosTab documentos={documentosQ.data ?? []} />,
          },
          {
            id: "sensible",
            etiqueta: "Sensibles",
            contenido: (
              <SensibleTab
                dato={sensibleQ.data ?? null}
                error={sensibleQ.isError}
                puedeEditar={puedeSensible}
                alEditar={() => setDialogo("sensible")}
              />
            ),
          },
        ]}
      />

      <DialogoEvento personaId={personaId} abierto={dialogo === "evento"} onCambio={(v) => setDialogo(v ? "evento" : null)} />
      <DialogoCargo personaId={personaId} abierto={dialogo === "cargo"} onCambio={(v) => setDialogo(v ? "cargo" : null)} />
      <DialogoCurso personaId={personaId} abierto={dialogo === "curso"} onCambio={(v) => setDialogo(v ? "curso" : null)} />
      <DialogoPremio personaId={personaId} abierto={dialogo === "premio"} onCambio={(v) => setDialogo(v ? "premio" : null)} />
      <DialogoLicencia personaId={personaId} abierto={dialogo === "licencia"} onCambio={(v) => setDialogo(v ? "licencia" : null)} />
      <DialogoAntiguedad
        personaId={personaId}
        actual={antiguedadQ.data}
        abierto={dialogo === "antiguedad"}
        onCambio={(v) => setDialogo(v ? "antiguedad" : null)}
      />
      <DialogoAbono
        personaId={personaId}
        abierto={dialogo === "abono"}
        onCambio={(v) => setDialogo(v ? "abono" : null)}
      />
      <DialogoSensible
        personaId={personaId}
        abierto={dialogo === "sensible"}
        onCambio={(v) => setDialogo(v ? "sensible" : null)}
        inicial={sensibleQ.data as unknown as Record<string, string | null> | null}
      />
    </div>
  );
}

function Dato({ icono: Icono, etiqueta, valor }: { icono: React.ComponentType<{ className?: string }>; etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icono className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{etiqueta}</p>
        <p className="break-words text-sm">{valor ?? "—"}</p>
      </div>
    </div>
  );
}

function Resumen({
  persona,
  antiguedad,
  situaciones,
  eventos,
  licencias,
  puedeEscribir,
  puedeAjustarAntiguedad,
  alAgregarEvento,
  alAgregarLicencia,
  alAjustarAntiguedad,
}: {
  persona: Persona;
  antiguedad: AntiguedadPersona | null | undefined;
  situaciones: SituacionEspecial[];
  eventos: PersonaEvento[];
  licencias: LicenciaConducir[];
  puedeEscribir: boolean;
  puedeAjustarAntiguedad: boolean;
  alAgregarEvento: () => void;
  alAgregarLicencia: () => void;
  alAjustarAntiguedad: () => void;
}) {
  const hoy = new Date();
  const ingreso = persona.fecha_ingreso ? new Date(persona.fecha_ingreso) : null;
  const aniosDesdeIngreso = ingreso ? hoy.getFullYear() - ingreso.getFullYear() : null;
  const vigentes = situaciones.filter((s) => !s.hasta || s.hasta >= hoy.toISOString().slice(0, 10));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Dato icono={IdCard} etiqueta="RUT" valor={persona.rut} />
          <Dato icono={CalendarDays} etiqueta="Nacimiento" valor={formatearFecha(persona.fecha_nacimiento)} />
          <Dato icono={CalendarDays} etiqueta="Ingreso" valor={formatearFecha(persona.fecha_ingreso)} />
          <Dato
            icono={History}
            etiqueta="Ingreso hace"
            valor={aniosDesdeIngreso !== null ? `${aniosDesdeIngreso} años` : "—"}
          />
          <Dato icono={Mail} etiqueta="Correo" valor={persona.email} />
          <Dato icono={Phone} etiqueta="Teléfono" valor={persona.telefono} />
          <Dato icono={MapPin} etiqueta="Dirección" valor={persona.direccion} />
          <Dato icono={UserRound} etiqueta="Sexo" valor={persona.sexo} />
          <div className="sm:col-span-2">
            <Dato icono={BookOpen} etiqueta="Observaciones" valor={persona.observaciones} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-4">
            <TarjetaAntiguedad
              antiguedad={antiguedad}
              puedeAjustar={puedeAjustarAntiguedad}
              alAjustar={alAjustarAntiguedad}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle>Situaciones vigentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vigentes.length === 0 && <p className="text-sm text-muted-foreground">Sin situaciones especiales.</p>}
            {vigentes.map((s) => (
              <div key={s.id} className="rounded-md border border-border p-2 text-sm">
                <p className="font-medium capitalize">{s.tipo.replaceAll("_", " ")}</p>
                <p className="text-xs text-muted-foreground">
                  {formatearFecha(s.desde)} → {s.hasta ? formatearFecha(s.hasta) : "sin término"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle>Licencias de conducir</CardTitle>
            {puedeEscribir && (
              <Button variant="ghost" size="sm" onClick={alAgregarLicencia}><Plus /> Agregar</Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {licencias.length === 0 && <p className="text-sm text-muted-foreground">Sin licencias registradas.</p>}
            {licencias.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
                <span>Clase {l.clase}</span>
                <SemaforoBadge vence={l.vence} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-3">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle>Historial de eventos</CardTitle>
          {puedeEscribir && (
            <Button variant="outline" size="sm" onClick={alAgregarEvento}><Plus /> Registrar evento</Button>
          )}
        </CardHeader>
        <CardContent>
          {eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
          ) : (
            <ol className="space-y-3">
              {eventos.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium capitalize">{e.tipo.replaceAll("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatearFecha(e.fecha)}
                      {e.rango ? ` · ${e.rango}` : ""}
                      {e.estado ? ` · ${e.estado}` : ""}
                    </p>
                    {e.motivo && <p className="text-sm text-muted-foreground">{e.motivo}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AsistenciaTab({ actual }: { actual?: AsistenciaPersona }) {
  if (!actual) {
    return <EmptyState titulo="Sin asistencia registrada" descripcion="Aún no hay listas con marcas para esta persona." icono={CalendarDays} />;
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Asistencias", actual.asistencias],
          ["Faltas", actual.faltas],
          ["Permisos", actual.permisos],
          ["Eximidos", actual.eximidos],
        ].map(([etiqueta, valor]) => (
          <Card key={String(etiqueta)}>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{valor}</p>
              <p className="text-xs text-muted-foreground">{etiqueta}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Porcentaje de asistencia {actual.anio}</p>
          <p className="mt-1 text-3xl font-bold text-primary">{formatearPorcentaje(actual.pct)}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(actual.pct ?? 0, 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Fórmula: asistencias / (asistencias + faltas + permisos + licencias). Eximidos y suspensiones no cuentan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CargosTab({ cargos, puedeEscribir, alAgregar }: { cargos: CargoPeriodo[]; puedeEscribir: boolean; alAgregar: () => void }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>Cargos y nombramientos</CardTitle>
        {puedeEscribir && <Button variant="outline" size="sm" onClick={alAgregar}><Plus /> Asignar cargo</Button>}
      </CardHeader>
      <CardContent className="space-y-2">
        {cargos.length === 0 && <p className="text-sm text-muted-foreground">Sin cargos registrados.</p>}
        {cargos.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <p className="font-medium">{c.cargo?.nombre ?? "Cargo"}</p>
              <p className="text-xs text-muted-foreground">{formatearFecha(c.desde)} → {c.hasta ? formatearFecha(c.hasta) : "vigente"}</p>
            </div>
            {(!c.hasta || c.hasta >= new Date().toISOString().slice(0, 10)) && <Badge variant="exito">Vigente</Badge>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FormacionTab({ cursos, puedeEscribir, alAgregar }: { cursos: PersonaCurso[]; puedeEscribir: boolean; alAgregar: () => void }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>Formación ANB y otros cursos</CardTitle>
        {puedeEscribir && <Button variant="outline" size="sm" onClick={alAgregar}><Plus /> Registrar curso</Button>}
      </CardHeader>
      <CardContent className="space-y-2">
        {cursos.length === 0 && <p className="text-sm text-muted-foreground">Sin cursos registrados.</p>}
        {cursos.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <p className="font-medium">{c.curso?.nombre ?? "Curso"}</p>
              <p className="text-xs text-muted-foreground">{c.curso?.institucion} · {c.curso?.nivel ?? "sin nivel"}</p>
            </div>
            <span className="text-sm text-muted-foreground">{formatearFecha(c.fecha_aprobacion)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PremiosTab({
  premios,
  puedeEscribir,
  alAgregar,
  alAgregarAbono,
}: {
  premios: PersonaPremio[];
  puedeEscribir: boolean;
  alAgregar: () => void;
  alAgregarAbono: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle>Premios y distinciones</CardTitle>
        {puedeEscribir && (
          <div className="flex flex-wrap gap-1">
            <Button variant="outline" size="sm" onClick={alAgregar}><Plus /> Registrar premio</Button>
            <Button variant="outline" size="sm" onClick={alAgregarAbono}><Plus /> Abono de antigüedad</Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {premios.length === 0 && <p className="text-sm text-muted-foreground">Sin premios registrados.</p>}
        {premios.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <p className="font-medium">{p.premio_tipo?.nombre ?? "Premio"}</p>
              <p className="text-xs text-muted-foreground">{p.anios ? `${p.anios} años` : "—"} · {p.otorgado_por ?? "—"}</p>
            </div>
            <span className="text-sm text-muted-foreground">{formatearFecha(p.fecha)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MaterialTab({ material }: { material: Asignacion[] }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle>Material a cargo</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {material.length === 0 && <p className="text-sm text-muted-foreground">Sin material asignado.</p>}
        {material.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <p className="font-medium">{a.articulo?.nombre ?? "Artículo"}</p>
              <p className="text-xs text-muted-foreground">
                {a.cantidad} un. · {a.talla ?? "sin talla"} · {a.origen}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Entrega {formatearFecha(a.fecha_entrega)}</p>
              <p>{a.fecha_devolucion ? `Devuelto ${formatearFecha(a.fecha_devolucion)}` : "Sin devolver"}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DocumentosTab({ documentos }: { documentos: DocumentoEmitido[] }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle>Documentos emitidos</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {documentos.length === 0 && <p className="text-sm text-muted-foreground">Sin documentos emitidos.</p>}
        {documentos.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <p className="font-medium">{d.tipo_documento_codigo} · Folio {d.anio}-{String(d.folio).padStart(4, "0")}</p>
              <p className="text-xs text-muted-foreground">Emitido {formatearFecha(d.emitido_en)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={d.anulado ? "peligro" : "exito"}>{d.anulado ? "Anulado" : "Válido"}</Badge>
              <Link
                to="/verificar/$token"
                params={{ token: d.token_verificacion }}
                className="text-sm text-primary hover:underline"
              >
                Verificar
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SensibleTab({
  dato,
  error,
  puedeEditar,
  alEditar,
}: {
  dato: DatoSensible | null;
  error: boolean;
  puedeEditar: boolean;
  alEditar: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-aviso/40 bg-aviso/5">
        <CardContent className="flex gap-3 pt-4 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-aviso" />
          <div>
            <p className="font-medium">Información confidencial</p>
            <p className="text-muted-foreground">
              Datos de salud y contacto de emergencia. Cada lectura de la oficialidad queda registrada en la auditoría.
              No se incluyen en la hoja de vida (P3).
            </p>
          </div>
        </CardContent>
      </Card>

      {error || !dato ? (
        <EmptyState
          titulo={error ? "Sin acceso a datos sensibles" : "Sin datos registrados"}
          descripcion={error ? "Tu rol no puede consultar esta sección." : "Aún no se han registrado datos de salud."}
          icono={error ? Lock : AlertTriangle}
          accion={
            puedeEditar && !error ? <Button variant="outline" onClick={alEditar}><Plus /> Registrar datos</Button> : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle>Ficha de salud</CardTitle>
            {puedeEditar && <Button variant="outline" size="sm" onClick={alEditar}>Editar</Button>}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Dato icono={IdCard} etiqueta="Grupo sanguíneo" valor={dato.grupo_sanguineo} />
            <Dato icono={AlertTriangle} etiqueta="Alergias" valor={dato.alergias} />
            <Dato icono={ShieldAlert} etiqueta="Condiciones" valor={dato.condiciones} />
            <Dato icono={BookOpen} etiqueta="Medicamentos" valor={dato.medicamentos} />
            <Dato icono={UserRound} etiqueta="Contacto de emergencia" valor={dato.contacto_emergencia_nombre} />
            <Dato icono={Phone} etiqueta="Teléfono de emergencia" valor={dato.contacto_emergencia_telefono} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
