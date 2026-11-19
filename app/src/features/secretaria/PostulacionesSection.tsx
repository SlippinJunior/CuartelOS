import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarClock,
  Check,
  FileText,
  Plus,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";
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
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import type { Persona } from "@/types/tipos";

interface Postulacion {
  id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  fecha_solicitud: string;
  estado: string;
  fecha_nacimiento: string | null;
  direccion: string | null;
  patrocinante_1_id: string | null;
  patrocinante_2_id: string | null;
  requisitos: Record<string, boolean>;
  resultado_votacion: "aceptada" | "rechazada" | null;
  fecha_votacion: string | null;
  acta_votacion_id: number | null;
  puede_repostular_desde: string | null;
  persona_creada_id: string | null;
  plazo_bombero_inicial: string | null;
  prorroga_hasta: string | null;
  prorroga_motivo: string | null;
  observaciones: string | null;
}

const REQUISITOS: Array<{ clave: string; etiqueta: string }> = [
  { clave: "mayor_18", etiqueta: "Mayor de 18 años" },
  { clave: "ensenanza_media", etiqueta: "Enseñanza media completa" },
  { clave: "declaracion_jurada", etiqueta: "Declaración jurada" },
  { clave: "cert_nacimiento", etiqueta: "Certificado de nacimiento" },
  { clave: "cert_antecedentes", etiqueta: "Certificado de antecedentes" },
  { clave: "salud_fisica", etiqueta: "Salud física compatible" },
  { clave: "salud_mental", etiqueta: "Salud mental compatible" },
  { clave: "cert_estudios", etiqueta: "Certificado de estudios" },
];

export function PostulacionesSection() {
  return (
    <Tabs
      items={[
        { id: "postulaciones", etiqueta: "Postulaciones", contenido: <ListaPostulaciones /> },
        { id: "altas-bajas", etiqueta: "Altas y bajas", contenido: <AltasBajas /> },
      ]}
    />
  );
}

function ListaPostulaciones() {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeGestionar = roles.some((r) => ["secretario", "prosecretario", "director", "admin"].includes(r));
  const [detalle, setDetalle] = React.useState<Postulacion | null>(null);
  const [nueva, setNueva] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["secretaria", "postulaciones"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("postulacion")
        .select("*")
        .order("fecha_solicitud", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Postulacion[];
    },
  });

  const recargar = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["secretaria", "postulaciones"] });
  }, [queryClient]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Alta de postulantes con checklist del art. 7 y votación sin conteo de votos.
        </p>
        {puedeGestionar && <Button onClick={() => setNueva(true)}><Plus /> Nuevo postulante</Button>}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState
          titulo="Sin postulaciones"
          descripcion="Registra el primer postulante para iniciar el expediente P1."
          icono={UserPlus}
        />
      )}

      <div className="space-y-2">
        {(data ?? []).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setDetalle(p)}
            className="w-full rounded-lg border border-border bg-card p-3 text-left hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{p.nombres} {p.apellido_paterno} {p.apellido_materno ?? ""}</p>
                <p className="text-xs text-muted-foreground">
                  {p.rut ?? "sin RUT"} · solicitó {formatearFecha(p.fecha_solicitud)}
                </p>
                {p.puede_repostular_desde && p.resultado_votacion === "rechazada" && (
                  <p className="mt-1 text-xs text-aviso">Puede repostular desde {formatearFecha(p.puede_repostular_desde)}</p>
                )}
                {p.plazo_bombero_inicial && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bombero inicial hasta {formatearFecha(p.prorroga_hasta ?? p.plazo_bombero_inicial)}
                  </p>
                )}
              </div>
              <Badge variant={variantePostulacion(p.estado)}>{p.estado.replace("_", " ")}</Badge>
            </div>
          </button>
        ))}
      </div>

      <DetallePostulacion
        postulacion={detalle}
        roles={roles}
        puedeGestionar={puedeGestionar}
        onCambio={(v) => !v && setDetalle(null)}
        onListo={recargar}
      />
      <NuevaPostulacion abierto={nueva} onCambio={setNueva} onCreada={recargar} />
    </div>
  );
}

function variantePostulacion(estado: string): "aviso" | "exito" | "peligro" | "apagado" | "secondary" {
  switch (estado) {
    case "aceptada":
      return "exito";
    case "rechazada":
      return "peligro";
    case "retirada":
      return "apagado";
    case "en_evaluacion":
      return "secondary";
    default:
      return "aviso";
  }
}

function NuevaPostulacion({
  abierto,
  onCambio,
  onCreada,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  onCreada: () => Promise<void>;
}) {
  const [form, setForm] = React.useState({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    rut: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    direccion: "",
  });

  const crear = useMutation({
    mutationFn: async () => {
      const { error } = await db.personal.from("postulacion").insert({
        nombres: form.nombres.trim(),
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno || null,
        rut: form.rut || null,
        email: form.email || null,
        telefono: form.telefono || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        direccion: form.direccion || null,
        estado: "recibida",
      } as never);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Postulante registrado");
      setForm({ nombres: "", apellido_paterno: "", apellido_materno: "", rut: "", email: "", telefono: "", fecha_nacimiento: "", direccion: "" });
      onCambio(false);
      await onCreada();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Nuevo postulante"
      descripcion="Datos básicos del art. 6 del Reglamento. Los requisitos se completan después."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => crear.mutate()} disabled={crear.isPending || form.nombres.length < 2 || form.apellido_paterno.length < 2}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="post-nombres">Nombres</Label>
            <Input id="post-nombres" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="post-rut">RUT</Label>
            <Input id="post-rut" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="post-ap">Apellido paterno</Label>
            <Input id="post-ap" value={form.apellido_paterno} onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="post-am">Apellido materno</Label>
            <Input id="post-am" value={form.apellido_materno} onChange={(e) => setForm({ ...form, apellido_materno: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="post-fn">Nacimiento</Label>
            <Input id="post-fn" type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="post-tel">Teléfono</Label>
            <Input id="post-tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="post-email">Correo</Label>
          <Input id="post-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="post-dir">Dirección</Label>
          <Input id="post-dir" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
        </div>
      </div>
    </Dialog>
  );
}

function puedesProrrogar(roles: readonly string[]): boolean {
  return roles.some((r) => ["capitan", "director", "admin"].includes(r));
}

function DetallePostulacion({
  postulacion,
  roles,
  puedeGestionar,
  onCambio,
  onListo,
}: {
  postulacion: Postulacion | null;
  roles: readonly string[];
  puedeGestionar: boolean;
  onCambio: (v: boolean) => void;
  onListo: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [requisitos, setRequisitos] = React.useState<Record<string, boolean>>({});
  const [patrocinante1, setPatrocinante1] = React.useState("");
  const [patrocinante2, setPatrocinante2] = React.useState("");
  const [votacionAbierta, setVotacionAbierta] = React.useState(false);
  const [resultado, setResultado] = React.useState<"aceptada" | "rechazada">("aceptada");
  const [observacionesVoto, setObservacionesVoto] = React.useState("");
  const [registro, setRegistro] = React.useState("");
  const [prorrogaAbierta, setProrrogaAbierta] = React.useState(false);
  const [prorrogaFecha, setProrrogaFecha] = React.useState("");
  const [prorrogaMotivo, setProrrogaMotivo] = React.useState("");

  React.useEffect(() => {
    if (!postulacion) return;
    setRequisitos(postulacion.requisitos ?? {});
    setPatrocinante1(postulacion.patrocinante_1_id ?? "");
    setPatrocinante2(postulacion.patrocinante_2_id ?? "");
    setRegistro("");
    setObservacionesVoto("");
  }, [postulacion]);

  const { data: personas } = useQuery({
    queryKey: ["personas-patrocinantes"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona")
        .select("id, registro, nombres, apellido_paterno")
        .eq("estado", "activo")
        .order("registro");
      if (error) throw error;
      return (data ?? []) as Persona[];
    },
    enabled: Boolean(postulacion),
  });

  const guardarRequisitos = useMutation({
    mutationFn: async () => {
      const { error } = await db.personal
        .from("postulacion")
        .update({
          requisitos,
          patrocinante_1_id: patrocinante1 || null,
          patrocinante_2_id: patrocinante2 || null,
        } as never)
        .eq("id", postulacion!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Expediente actualizado");
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const votar = useMutation({
    mutationFn: async () => {
      const { error } = await db.secretaria.rpc("registrar_votacion_postulacion", {
        p_postulacion_id: postulacion!.id,
        p_resultado: resultado,
        p_fecha: new Date().toISOString().slice(0, 10),
        p_acta_id: null,
        p_observaciones: observacionesVoto || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Votación registrada");
      setVotacionAbierta(false);
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const incorporar = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.secretaria.rpc("incorporar_aspirante", {
        p_postulacion_id: postulacion!.id,
        p_registro: Number(registro),
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: async (id) => {
      toast.success("Aspirante incorporado a Personal");
      await queryClient.invalidateQueries({ queryKey: ["personal"] });
      await onListo();
      void id;
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const prorrogar = useMutation({
    mutationFn: async () => {
      const { error } = await db.secretaria.rpc("prorrogar_aspirante", {
        p_postulacion_id: postulacion!.id,
        p_nueva_fecha: prorrogaFecha,
        p_motivo: prorrogaMotivo,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Prórroga registrada");
      setProrrogaAbierta(false);
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const emitir = async (tipo: "P1" | "P2") => {
    try {
      const { data, error } = await supabase.functions.invoke("emitir-secretaria-pdf", {
        body: { tipo, postulacion_id: postulacion!.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const { data: firmada } = await supabase.storage.from("documentos").createSignedUrl(data.pdf_path, 3600);
      if (firmada?.signedUrl) window.open(firmada.signedUrl, "_blank");
      toast.success(`${tipo} emitido con folio ${data.anio}-${String(data.folio).padStart(4, "0")}`);
      await onListo();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  if (!postulacion) return null;

  const p = postulacion;
  const completos = REQUISITOS.filter((r) => requisitos[r.clave]).length;

  return (
    <>
      <Dialog
        abierto={Boolean(postulacion)}
        onCambio={onCambio}
        titulo={`${p.nombres} ${p.apellido_paterno}`}
        descripcion={`Postulación del ${formatearFecha(p.fecha_solicitud)} · ${p.estado.replace("_", " ")}`}
        tamano="lg"
        pie={
          <>
            <Button variant="outline" onClick={() => onCambio(false)}>Cerrar</Button>
            <Button variant="outline" onClick={() => void emitir("P1")}>
              <FileText /> Expediente P1
            </Button>
            {p.resultado_votacion && puedeGestionar && (
              <Button variant="outline" onClick={() => void emitir("P2")}>
                <FileText /> Acta P2
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-2">
            <div><dt className="text-xs text-muted-foreground">RUT</dt><dd>{p.rut ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Nacimiento</dt><dd>{formatearFecha(p.fecha_nacimiento)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Correo</dt><dd>{p.email ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Teléfono</dt><dd>{p.telefono ?? "—"}</dd></div>
          </dl>

          <div className="rounded-md border border-border p-3">
            <p className="mb-2 font-medium">Checklist art. 7 ({completos}/{REQUISITOS.length})</p>
            <div className="grid gap-1 sm:grid-cols-2">
              {REQUISITOS.map((r) => (
                <label key={r.clave} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primario)]"
                    checked={Boolean(requisitos[r.clave])}
                    onChange={(e) => setRequisitos({ ...requisitos, [r.clave]: e.target.checked })}
                    disabled={!puedeGestionar}
                  />
                  {r.etiqueta}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="patro-1">Patrocinante 1</Label>
              <Select id="patro-1" value={patrocinante1} onChange={(e) => setPatrocinante1(e.target.value)} disabled={!puedeGestionar}>
                <option value="">Sin patrocinante</option>
                {(personas ?? []).map((x) => (
                  <option key={x.id} value={x.id}>{x.registro} · {x.nombres} {x.apellido_paterno}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="patro-2">Patrocinante 2</Label>
              <Select id="patro-2" value={patrocinante2} onChange={(e) => setPatrocinante2(e.target.value)} disabled={!puedeGestionar}>
                <option value="">Sin patrocinante</option>
                {(personas ?? []).map((x) => (
                  <option key={x.id} value={x.id}>{x.registro} · {x.nombres} {x.apellido_paterno}</option>
                ))}
              </Select>
            </div>
          </div>

          {puedeGestionar && (
            <Button variant="secondary" onClick={() => guardarRequisitos.mutate()} disabled={guardarRequisitos.isPending}>
              Guardar expediente
            </Button>
          )}

          <div className="rounded-md border border-border p-3">
            <p className="mb-2 font-medium">Votación de ingreso (art. 7)</p>
            {p.resultado_votacion ? (
              <div className="space-y-1">
                <Badge variant={p.resultado_votacion === "aceptada" ? "exito" : "peligro"}>{p.resultado_votacion}</Badge>
                <p className="text-xs text-muted-foreground">Registrada el {formatearFecha(p.fecha_votacion)}</p>
                {p.resultado_votacion === "rechazada" && p.puede_repostular_desde && (
                  <p className="text-xs text-aviso">Puede repostular desde {formatearFecha(p.puede_repostular_desde)}</p>
                )}
                {p.resultado_votacion === "aceptada" && p.plazo_bombero_inicial && (
                  <p className="text-xs text-muted-foreground">
                    Período de bombero inicial: hasta {formatearFecha(p.prorroga_hasta ?? p.plazo_bombero_inicial)}
                  </p>
                )}
              </div>
            ) : puedeGestionar ? (
              <Button size="sm" variant="outline" onClick={() => setVotacionAbierta(true)}>
                Registrar votación
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Sin registrar.</p>
            )}
          </div>

          {p.resultado_votacion === "aceptada" && !p.persona_creada_id && puedeGestionar && (
            <div className="rounded-md border border-exito/40 bg-exito/5 p-3 space-y-2">
              <p className="flex items-center gap-2 font-medium"><UserPlus className="size-4" /> Incorporar como aspirante</p>
              <div className="flex gap-2">
                <Input placeholder="N° de registro" inputMode="numeric" value={registro} onChange={(e) => setRegistro(e.target.value)} />
                <Button onClick={() => incorporar.mutate()} disabled={!registro || incorporar.isPending}>
                  <Check /> Incorporar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Crea la ficha en Personal con rango aspirante y fecha de ingreso de hoy.</p>
            </div>
          )}

          {p.persona_creada_id && (
            <div className="rounded-md border border-border p-3">
              <p className="flex items-center gap-2 font-medium"><CalendarClock className="size-4" /> Bombero inicial</p>
              <p className="text-xs text-muted-foreground">
                Plasma hasta {formatearFecha(p.prorroga_hasta ?? p.plazo_bombero_inicial)}
                {p.prorroga_motivo ? ` · prórroga: ${p.prorroga_motivo}` : ""}
              </p>
              {!p.prorroga_hasta && puedesProrrogar(roles) && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setProrrogaAbierta(true)}>
                  Solicitar prórroga (máx. 3 meses)
                </Button>
              )}
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        abierto={votacionAbierta}
        onCambio={(v) => setVotacionAbierta(v)}
        titulo="Registrar votación de ingreso"
        descripcion="El art. 7 registra solo el resultado, sin número de votos."
        pie={
          <>
            <Button variant="outline" onClick={() => setVotacionAbierta(false)}>Cancelar</Button>
            <Button onClick={() => votar.mutate()} disabled={votar.isPending}>
              <Check /> Registrar {resultado}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="voto-resultado">Resultado</Label>
            <Select id="voto-resultado" value={resultado} onChange={(e) => setResultado(e.target.value as "aceptada" | "rechazada")}>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="voto-obs">Observaciones</Label>
            <Textarea id="voto-obs" value={observacionesVoto} onChange={(e) => setObservacionesVoto(e.target.value)} />
          </div>
          {resultado === "rechazada" && (
            <p className="rounded-md bg-aviso/10 p-2 text-xs text-aviso">
              El postulante no podrá repostular durante 6 meses.
            </p>
          )}
        </div>
      </Dialog>

      <Dialog
        abierto={prorrogaAbierta}
        onCambio={(v) => setProrrogaAbierta(v)}
        titulo="Prórroga del período de bombero inicial"
        descripcion="Una sola vez, hasta 3 meses, autorizada por el Capitán (art. 8)."
        pie={
          <>
            <Button variant="outline" onClick={() => setProrrogaAbierta(false)}>Cancelar</Button>
            <Button onClick={() => prorrogar.mutate()} disabled={prorrogar.isPending || !prorrogaFecha || prorrogaMotivo.length < 3}>
              Registrar prórroga
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="pro-fecha">Nueva fecha de término</Label>
            <Input id="pro-fecha" type="date" value={prorrogaFecha} onChange={(e) => setProrrogaFecha(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pro-motivo">Motivo</Label>
            <Textarea id="pro-motivo" value={prorrogaMotivo} onChange={(e) => setProrrogaMotivo(e.target.value)} />
          </div>
        </div>
      </Dialog>
    </>
  );
}

function AltasBajas() {
  const [desde, setDesde] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  });
  const [hasta, setHasta] = React.useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ["secretaria", "altas-bajas", desde, hasta],
    queryFn: async () => {
      const { data, error } = await db.secretaria.rpc("altas_y_bajas", { p_desde: desde, p_hasta: hasta });
      if (error) throw error;
      return (data ?? []) as Array<{
        evento_id: number;
        persona_id: string;
        registro: number;
        nombre: string;
        tipo: string;
        fecha: string;
        estado_actual: string;
        vence_plazo: string;
        dentro_plazo: boolean;
        comunicado: boolean;
        documento_id: string | null;
      }>;
    },
  });

  const emitirP4 = async (eventoId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke("emitir-secretaria-pdf", {
        body: { tipo: "P4", evento_ids: [eventoId] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const { data: firmada } = await supabase.storage.from("documentos").createSignedUrl(data.pdf_path, 3600);
      if (firmada?.signedUrl) window.open(firmada.signedUrl, "_blank");
      toast.success(`Comunicación P4 emitida: ${data.anio}-${String(data.folio).padStart(4, "0")}`);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="ab-desde">Desde</Label>
          <Input id="ab-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ab-hasta">Hasta</Label>
          <Input id="ab-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        <Badge variant="outline" className="mb-3">{(data ?? []).length} eventos</Badge>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="size-4" /> Art. 51 i: la comunicación al Cuerpo tiene un plazo de 3 días.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      <div className="space-y-2">
        {(data ?? []).map((e) => (
          <div key={e.evento_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
            <div>
              <p className="font-medium">
                <span className="mr-2 font-mono text-xs text-muted-foreground">{e.registro}</span>
                {e.nombre}
              </p>
              <p className="text-xs text-muted-foreground">
                {e.tipo.replace("_", " ")} · {formatearFecha(e.fecha)} · vence {formatearFecha(e.vence_plazo)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={e.comunicado ? "exito" : e.dentro_plazo ? "aviso" : "peligro"}>
                {e.comunicado ? "Comunicado" : e.dentro_plazo ? "Pendiente" : "Fuera de plazo"}
              </Badge>
              {!e.comunicado && (
                <Button size="sm" variant="outline" onClick={() => void emitirP4(e.evento_id)}>
                  <FileText /> P4
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && (data ?? []).length === 0 && (
        <EmptyState titulo="Sin movimientos" descripcion="No hay altas ni bajas en el período." icono={X} />
      )}
    </div>
  );
}
