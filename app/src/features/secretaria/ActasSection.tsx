import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, Download, FileText, Pencil, Plus, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import type { ActaListado, Acuerdo } from "@/types/tipos";

interface TipoSesion {
  codigo: string;
  nombre: string;
}

interface ListaOpcion {
  id: number;
  anio: number;
  numero: number;
  fecha: string;
}

interface AsistenciaResumen {
  a: number;
  f: number;
  p: number;
}

export interface SeccionesActa {
  hora_inicio?: string;
  hora_termino?: string;
  preside?: string;
  acta_anterior?: string;
  correspondencia?: string;
  cuenta_oficiales?: string;
  incidentes?: string;
  varios?: string;
}

const CAMPOS_SECCION: Array<{ clave: keyof SeccionesActa; etiqueta: string; multilinea: boolean }> = [
  { clave: "hora_inicio", etiqueta: "Hora de inicio", multilinea: false },
  { clave: "hora_termino", etiqueta: "Hora de término", multilinea: false },
  { clave: "preside", etiqueta: "Preside la sesión", multilinea: false },
  { clave: "acta_anterior", etiqueta: "Lectura del acta anterior", multilinea: true },
  { clave: "correspondencia", etiqueta: "Correspondencia", multilinea: true },
  { clave: "cuenta_oficiales", etiqueta: "Cuenta de los oficiales", multilinea: true },
  { clave: "incidentes", etiqueta: "Incidentes", multilinea: true },
  { clave: "varios", etiqueta: "Varios", multilinea: true },
];

function textoCompilado(secciones: SeccionesActa): string {
  return CAMPOS_SECCION
    .filter((c) => (secciones[c.clave] ?? "").trim() !== "")
    .map((c) => `${c.etiqueta}: ${secciones[c.clave]}`)
    .join("\n");
}

export function ActasSection() {
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeEditar = roles.some((r) => ["secretario", "prosecretario", "director", "admin"].includes(r));
  const esOficial = perfil?.es_oficial ?? false;

  const [anio, setAnio] = React.useState(String(new Date().getFullYear()));
  const [estado, setEstado] = React.useState("");
  const [editor, setEditor] = React.useState<ActaListado | "nuevo" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["secretaria", "actas"],
    queryFn: async () => {
      const { data, error } = await db.secretaria
        .from("acta")
        .select("*, tipo_sesion:tipo_sesion(nombre)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActaListado[];
    },
  });

  const filas = (data ?? []).filter(
    (a) =>
      String(a.anio) === anio &&
      (!estado || (estado === "borrador" ? !a.aprobada_en_acta_id : Boolean(a.aprobada_en_acta_id))),
  );

  const columnas: Columna<ActaListado>[] = [
    {
      clave: "acta",
      titulo: "Acta",
      render: (a) => (
        <div>
          <p className="font-medium">N° {a.numero}/{a.anio}</p>
          <p className="text-xs text-muted-foreground">{a.tipo_sesion?.nombre ?? a.tipo_sesion_codigo}</p>
        </div>
      ),
    },
    { clave: "fecha", titulo: "Fecha", render: (a) => formatearFecha(a.fecha) },
    {
      clave: "estado",
      titulo: "Estado",
      render: (a) => (
        <Badge variant={a.aprobada_en_acta_id ? "exito" : "aviso"}>
          {a.aprobada_en_acta_id ? "Aprobada" : "Borrador"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
        <Select value={anio} onChange={(e) => setAnio(e.target.value)} aria-label="Año" className="w-full sm:w-28">
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <Select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado" className="w-full sm:w-40">
          <option value="">Todas</option>
          <option value="borrador">Borradores</option>
          <option value="aprobada">Aprobadas</option>
        </Select>
        <Badge variant="outline" className="w-fit self-center">
          {filas.length} actas
        </Badge>
        {puedeEditar && (
          <Button className="col-span-2 w-full sm:col-span-1 sm:ml-auto sm:w-auto" onClick={() => setEditor("nuevo")}>
            <Plus /> Nueva acta
          </Button>
        )}
      </div>

      <ResponsiveList
        filas={filas}
        columnas={columnas}
        claveFila={(a) => a.id}
        cargando={isLoading}
        alHacerClic={(a) => setEditor(a)}
        renderTarjeta={(a) => (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Acta N° {a.numero}/{a.anio}</p>
              <p className="text-sm text-muted-foreground">{a.tipo_sesion?.nombre ?? a.tipo_sesion_codigo}</p>
              <p className="text-xs text-muted-foreground">{formatearFecha(a.fecha)}</p>
            </div>
            <Badge variant={a.aprobada_en_acta_id ? "exito" : "aviso"}>
              {a.aprobada_en_acta_id ? "Aprobada" : "Borrador"}
            </Badge>
          </div>
        )}
        vacio={
          <EmptyState
            titulo="Sin actas"
            descripcion={esOficial ? "Aún no hay actas para este año." : "No hay actas aprobadas publicadas."}
            icono={BookOpen}
            accion={puedeEditar ? <Button variant="outline" onClick={() => setEditor("nuevo")}><Plus /> Crear acta</Button> : undefined}
          />
        }
      />

      <EditorActa
        acta={editor === "nuevo" ? null : editor}
        abierto={editor !== null}
        puedeEditar={puedeEditar}
        onCambio={() => setEditor(null)}
      />
    </div>
  );
}

function EditorActa({
  acta,
  abierto,
  puedeEditar,
  onCambio,
}: {
  acta: ActaListado | null;
  abierto: boolean;
  puedeEditar: boolean;
  onCambio: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const esDirector = (perfil?.roles ?? []).some((r) => ["director", "admin"].includes(r));

  const [tipo, setTipo] = React.useState("RO");
  const [numero, setNumero] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [listaId, setListaId] = React.useState("");
  const [quorum, setQuorum] = React.useState(true);
  const [secciones, setSecciones] = React.useState<SeccionesActa>({});
  const [texto, setTexto] = React.useState("");
  const [acuerdosTexto, setAcuerdosTexto] = React.useState("");
  const [acuerdosExistentes, setAcuerdosExistentes] = React.useState<Acuerdo[]>([]);
  const [verSeccion, setVerSeccion] = React.useState(true);

  const nuevo = acta === null;
  const aprobada = Boolean(acta?.aprobada_en_acta_id);
  const bloqueado = !puedeEditar || (aprobada && !esDirector);

  const { data: tipos } = useQuery({
    queryKey: ["tipos-sesion"],
    queryFn: async () => {
      const { data, error } = await db.secretaria.from("tipo_sesion").select("codigo, nombre").order("codigo");
      if (error) throw error;
      return (data ?? []) as TipoSesion[];
    },
    enabled: abierto,
  });

  const { data: listas } = useQuery({
    queryKey: ["listas-para-acta"],
    queryFn: async () => {
      const { data, error } = await db.asistencia
        .from("lista")
        .select("id, anio, numero, fecha")
        .order("fecha", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as ListaOpcion[];
    },
    enabled: abierto,
  });

  const { data: asistencia } = useQuery({
    queryKey: ["acta-asistencia", listaId],
    queryFn: async () => {
      const { data, error } = await db.asistencia.from("asistencia").select("marca").eq("lista_id", Number(listaId));
      if (error) throw error;
      const r: AsistenciaResumen = { a: 0, f: 0, p: 0 };
      for (const fila of (data ?? []) as Array<{ marca: string }>) {
        if (fila.marca === "A") r.a++;
        else if (fila.marca === "F") r.f++;
        else r.p++;
      }
      return r;
    },
    enabled: Boolean(listaId),
  });

  const { data: acuerdosQ } = useQuery({
    queryKey: ["acta-acuerdos", acta?.id],
    queryFn: async () => {
      const { data, error } = await db.secretaria.from("acuerdo").select("*").eq("acta_id", acta!.id).order("numero");
      if (error) throw error;
      return (data ?? []) as Acuerdo[];
    },
    enabled: Boolean(acta?.id),
  });

  React.useEffect(() => {
    if (acuerdosQ) setAcuerdosExistentes(acuerdosQ);
  }, [acuerdosQ]);

  const { data: ultima } = useQuery({
    queryKey: ["ultima-acta", tipo, fecha.slice(0, 4)],
    queryFn: async () => {
      // Se calcula con todas las actas del año para no depender de la
      // secuencia interna cuando el seed inserta IDs explícitos.
      const { data, error } = await db.secretaria
        .from("acta")
        .select("numero, tipo_sesion_codigo, anio")
        .eq("anio", Number(fecha.slice(0, 4)));
      if (error) throw error;
      const delTipo = (data ?? []).filter((a) => a.tipo_sesion_codigo === tipo);
      const maximo = delTipo.reduce((m, a) => Math.max(m, Number(a.numero)), 0);
      const { count } = await db.secretaria
        .from("acta")
        .select("id", { count: "exact", head: true });
      return { numero: maximo, siguiente_id: (count ?? 0) + 1 };
    },
    enabled: abierto && nuevo,
  });

  React.useEffect(() => {
    if (!abierto) return;
    if (acta) {
      setTipo(acta.tipo_sesion_codigo);
      setNumero(String(acta.numero));
      setFecha(acta.fecha);
      setListaId(acta.lista_id ? String(acta.lista_id) : "");
      setQuorum(Boolean(acta.quorum_ok));
      setSecciones(((acta as unknown as { secciones?: SeccionesActa }).secciones ?? {}) as SeccionesActa);
      setTexto(acta.texto ?? "");
      setAcuerdosTexto("");
    } else {
      setNumero(String((ultima?.numero ?? 0) + 1));
      setSecciones({});
      setTexto("");
      setAcuerdosTexto("");
    }
  }, [abierto, acta, ultima]);

  const { data: documento } = useQuery({
    queryKey: ["acta-documento", acta?.id],
    queryFn: async () => {
      const { data, error } = await db.documentos
        .from("documento_emitido")
        .select("*")
        .eq("referencia", `ACTA:${acta?.id}`)
        .order("emitido_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; token_verificacion: string; pdf_archivo_id: string | null } | null;
    },
    enabled: Boolean(acta?.id),
  });

  const { data: archivo } = useQuery({
    queryKey: ["acta-archivo", documento?.pdf_archivo_id],
    queryFn: async () => {
      const { data, error } = await db.documentos
        .from("archivo")
        .select("bucket, path")
        .eq("id", documento?.pdf_archivo_id)
        .maybeSingle();
      if (error) throw error;
      return data as { bucket: string; path: string } | null;
    },
    enabled: Boolean(documento?.pdf_archivo_id),
  });

  const [urlPdf, setUrlPdf] = React.useState<string | null>(null);
  React.useEffect(() => {
    let vivo = true;
    if (archivo?.bucket && archivo.path) {
      void supabase.storage.from(archivo.bucket).createSignedUrl(archivo.path, 3600).then(({ data }) => {
        if (vivo) setUrlPdf(data?.signedUrl ?? null);
      });
    } else setUrlPdf(null);
    return () => {
      vivo = false;
    };
  }, [archivo]);

  const guardar = useMutation({
    mutationFn: async () => {
      const payload = {
        tipo_sesion_codigo: tipo,
        numero: Number(numero),
        anio: Number(fecha.slice(0, 4)),
        fecha,
        lista_id: listaId ? Number(listaId) : null,
        quorum_ok: quorum,
        secciones,
        texto: texto || textoCompilado(secciones) || null,
      };

      let actaId = acta?.id;
      if (nuevo) {
        const { data, error } = await db.secretaria.rpc("crear_acta", {
          p_tipo: tipo,
          p_fecha: fecha,
          p_lista_id: listaId ? Number(listaId) : null,
          p_quorum: quorum,
          p_secciones: secciones,
          p_texto: texto || textoCompilado(secciones) || null,
        });
        if (error) throw error;
        actaId = Number(data);
      } else {
        const { error } = await db.secretaria.from("acta").update(payload as never).eq("id", actaId!);
        if (error) throw error;
      }

      const lineas = acuerdosTexto.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lineas.length > 0) {
        const inicio = acuerdosExistentes.length + 1;
        const { error } = await db.secretaria.from("acuerdo").insert(
          lineas.map((linea, i) => ({
            acta_id: actaId,
            numero: inicio + i,
            texto: linea,
            estado: "pendiente",
          })) as never,
        );
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(nuevo ? "Acta creada" : "Acta guardada");
      setAcuerdosTexto("");
      await queryClient.invalidateQueries({ queryKey: ["secretaria", "actas"] });
      await queryClient.invalidateQueries({ queryKey: ["acta-acuerdos"] });
      await queryClient.invalidateQueries({ queryKey: ["acta-documento"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const aprobar = useMutation({
    mutationFn: async () => {
      const { error } = await db.secretaria
        .from("acta")
        .update({ aprobada_en_acta_id: acta!.id } as never)
        .eq("id", acta!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Acta aprobada y publicada");
      await queryClient.invalidateQueries({ queryKey: ["secretaria", "actas"] });
      onCambio();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const emitir = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("emitir-acta", { body: { acta_id: acta!.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.pdf_path) {
        const { data: firmada } = await supabase.storage.from("documentos").createSignedUrl(data.pdf_path, 3600);
        setUrlPdf(firmada?.signedUrl ?? null);
      }
      return data as { anio: number; folio: number };
    },
    onSuccess: async (data) => {
      toast.success(`Acta emitida con folio ${data.anio}-${String(data.folio).padStart(4, "0")}`);
      await queryClient.invalidateQueries({ queryKey: ["acta-documento", acta?.id] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo={nuevo ? "Nueva acta" : `Acta N° ${acta?.numero}/${acta?.anio}`}
      descripcion={nuevo ? "Completa las secciones reglamentarias." : `${acta?.tipo_sesion?.nombre ?? ""} · ${formatearFecha(acta?.fecha)}`}
      tamano="lg"
      pie={
        <>
          <Button variant="outline" onClick={onCambio}>Cerrar</Button>
          {urlPdf && (
            <a href={urlPdf} target="_blank" rel="noreferrer">
              <Button variant="outline"><Download /> PDF</Button>
            </a>
          )}
          {!bloqueado && (
            <Button variant="secondary" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
              Guardar
            </Button>
          )}
          {!nuevo && (
            <Button variant="outline" onClick={() => emitir.mutate()} disabled={emitir.isPending}>
              <FileText /> {emitir.isPending ? "Emitiendo…" : "Emitir PDF"}
            </Button>
          )}
          {!nuevo && !aprobada && puedeEditar && (
            <Button onClick={() => aprobar.mutate()} disabled={aprobar.isPending}>
              <CheckCircle2 /> Aprobar
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {aprobada && bloqueado && (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Acta aprobada: el contenido está bloqueado. Solo Director o admin pueden corregirlo.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="acta-tipo">Tipo de sesión</Label>
            <Select id="acta-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={bloqueado}>
              {(tipos ?? []).map((t) => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="acta-numero">Número</Label>
            <Input id="acta-numero" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} disabled={bloqueado} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acta-fecha">Fecha</Label>
            <Input id="acta-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={bloqueado} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="acta-lista">Lista de asistencia</Label>
            <Select id="acta-lista" value={listaId} onChange={(e) => setListaId(e.target.value)} disabled={bloqueado}>
              <option value="">Sin lista</option>
              {(listas ?? []).map((l) => (
                <option key={l.id} value={l.id}>N° {l.numero}/{l.anio} · {formatearFecha(l.fecha)}</option>
              ))}
            </Select>
            {asistencia && (
              <p className="text-xs text-muted-foreground">
                Presentes {asistencia.a} · Permisos {asistencia.p} · Faltas {asistencia.f}
              </p>
            )}
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-[var(--primario)]"
              checked={quorum}
              onChange={(e) => setQuorum(e.target.checked)}
              disabled={bloqueado}
            />
            Se cumplió el quórum
          </label>
        </div>

        <div>
          <button
            type="button"
            className="mb-2 flex items-center gap-2 text-sm font-semibold"
            onClick={() => setVerSeccion(!verSeccion)}
          >
            <Pencil className="size-4" /> Secciones reglamentarias
            <Badge variant="outline">{verSeccion ? "ocultar" : "editar"}</Badge>
          </button>
          {verSeccion && (
            <div className="space-y-3 rounded-md border border-border p-3">
              {CAMPOS_SECCION.map((c) => (
                <div key={c.clave} className="space-y-1">
                  <Label htmlFor={`sec-${c.clave}`}>{c.etiqueta}</Label>
                  {c.multilinea ? (
                    <Textarea
                      id={`sec-${c.clave}`}
                      className="min-h-16"
                      value={secciones[c.clave] ?? ""}
                      onChange={(e) => setSecciones({ ...secciones, [c.clave]: e.target.value })}
                      disabled={bloqueado}
                    />
                  ) : (
                    <Input
                      id={`sec-${c.clave}`}
                      value={secciones[c.clave] ?? ""}
                      onChange={(e) => setSecciones({ ...secciones, [c.clave]: e.target.value })}
                      disabled={bloqueado}
                    />
                  )}
                </div>
              ))}
              <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                <p className="mb-1 font-medium">Texto compilado para el PDF</p>
                <pre className="whitespace-pre-wrap font-sans">{textoCompilado(secciones) || "Sin contenido todavía."}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="acta-texto">Observaciones generales</Label>
          <Textarea id="acta-texto" value={texto} onChange={(e) => setTexto(e.target.value)} disabled={bloqueado} />
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acuerdos</p>
          {acuerdosExistentes.length > 0 && (
            <ol className="mb-2 list-inside list-decimal space-y-1 text-sm">
              {acuerdosExistentes.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-2">
                  <span>{a.texto}</span>
                  <Badge variant="outline">{a.estado}</Badge>
                </li>
              ))}
            </ol>
          )}
          {!bloqueado && (
            <>
              <Label htmlFor="acta-acuerdos">Nuevos acuerdos (uno por línea)</Label>
              <Textarea
                id="acta-acuerdos"
                value={acuerdosTexto}
                onChange={(e) => setAcuerdosTexto(e.target.value)}
                placeholder={"Aprobar el presupuesto 2026\nAutorizar la compra de EPP"}
              />
            </>
          )}
        </div>

        {!nuevo && documento && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="exito"><ShieldCheck className="mr-1 size-3" /> PDF emitido</Badge>
            <Link to="/verificar/$token" params={{ token: documento.token_verificacion }} className="text-sm text-primary hover:underline">
              Verificar
            </Link>
          </div>
        )}
      </div>
    </Dialog>
  );
}
