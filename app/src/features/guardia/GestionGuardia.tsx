import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarPlus,
  Check,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatearFecha } from "@/lib/formato";
import type { GrillaGuardia } from "@/types/tipos";

interface CicloLista {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  cupo_base: number;
}

interface ResultadoNotificacion {
  correo?: { enviados: number; total: number; error: string | null };
  whatsapp?: {
    configurado: boolean;
    enviados: number;
    enlaces: Array<{ nombre: string; telefono: string | null; enlace: string | null }>;
  };
  texto_grupo?: string;
}

export function GestionGuardia() {
  const queryClient = useQueryClient();
  const [nuevo, setNuevo] = React.useState(false);
  const [aviso, setAviso] = React.useState<ResultadoNotificacion | null>(null);

  const ciclosQ = useQuery({
    queryKey: ["guardia", "ciclos"],
    queryFn: async () => {
      const { data, error } = await db.operaciones
        .from("guardia_ciclo")
        .select("*")
        .order("fecha_inicio", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as CicloLista[];
    },
  });

  const cicloActual = ciclosQ.data?.[0] ?? null;
  const grillaQ = useQuery({
    queryKey: ["guardia", "grilla", null],
    queryFn: async () => {
      const { data, error } = await db.operaciones.rpc("grilla_ciclo", { p_ciclo_id: null });
      if (error) throw error;
      return data as unknown as GrillaGuardia | null;
    },
  });

  const recargar = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["guardia"] });
  }, [queryClient]);

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      const { error } = await db.operaciones.from("guardia_ciclo").update({ estado } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Estado del ciclo actualizado");
      await recargar();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const convocatoria = async (semana: number) => {
    if (!grillaQ.data) return;
    try {
      const { data, error } = await supabase.functions.invoke("notificar-guardias", {
        body: { modo: "convocatoria_semana", ciclo_id: grillaQ.data.ciclo.id, semana_num: semana },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAviso(data as ResultadoNotificacion);
      toast.success(`Convocatoria de la semana ${semana} enviada`);
      await recargar();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const llegadas = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("notificar-guardias", {
        body: { modo: "llegadas_tardias" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Aviso de llegadas tardías enviado");
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const emitirPdf = async (semana: number | null) => {
    if (!grillaQ.data) return;
    try {
      const { data, error } = await supabase.functions.invoke("emitir-guardia-pdf", {
        body: { ciclo_id: grillaQ.data.ciclo.id, semana_num: semana },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const { data: firmada } = await supabase.storage.from("documentos").createSignedUrl(data.pdf_path, 3600);
      if (firmada?.signedUrl) window.open(firmada.signedUrl, "_blank");
      toast.success(`Rol de guardia emitido con folio ${data.anio}-${String(data.folio).padStart(4, "0")}`);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
          <div>
            <CardTitle>Ciclo de guardias</CardTitle>
            <CardDescription>
              {cicloActual
                ? `${cicloActual.nombre} · ${formatearFecha(cicloActual.fecha_inicio)} al ${formatearFecha(cicloActual.fecha_fin)}`
                : "Aún no hay ciclos agendados."}
            </CardDescription>
          </div>
          <Button onClick={() => setNuevo(true)}><CalendarPlus /> Nuevo ciclo</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {cicloActual && (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={cicloActual.estado}
                onChange={(e) => cambiarEstado.mutate({ id: cicloActual.id, estado: e.target.value })}
                aria-label="Estado del ciclo"
                className="w-auto"
              >
                <option value="planificado">Planificado</option>
                <option value="abierto">Abierto</option>
                <option value="en_curso">En curso</option>
                <option value="cerrado">Cerrado</option>
              </Select>
              <Badge variant={grillaQ.data?.semana_1_cubierta ? "exito" : "aviso"}>
                Semana 1 {grillaQ.data?.semana_1_cubierta ? "cubierta" : "incompleta"}
              </Badge>
              <Badge variant={grillaQ.data?.semana_2_cubierta ? "exito" : "aviso"}>
                Semana 2 {grillaQ.data?.semana_2_cubierta ? "cubierta" : "incompleta"}
              </Badge>
            </div>
          )}
          {(ciclosQ.data ?? []).length > 1 && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {ciclosQ.data!.slice(1).map((c) => (
                <li key={c.id}>{c.nombre} · {c.estado}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><Mail className="size-5 text-primary" /> Convocatorias</CardTitle>
          <CardDescription>Correo + WhatsApp a todos los bomberos activos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void convocatoria(1)} disabled={!cicloActual}>
            <Send /> Convocatoria Semana 1
          </Button>
          <Button variant="outline" onClick={() => void convocatoria(2)} disabled={!cicloActual}>
            <Send /> Convocatoria Semana 2
          </Button>
          <Button variant="outline" onClick={() => void llegadas()}>
            <MessageCircle /> Enviar llegadas tardías
          </Button>
        </CardContent>
      </Card>

      {aviso && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mensaje para WhatsApp</CardTitle>
            <CardDescription>
              Correo: {aviso.correo?.enviados ?? 0}/{aviso.correo?.total ?? 0}
              {aviso.whatsapp?.configurado
                ? ` · WhatsApp: ${aviso.whatsapp.enviados}/${aviso.whatsapp.enlaces.length}`
                : " · WhatsApp sin credenciales: usa los enlaces"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea readOnly className="min-h-32" value={aviso.texto_grupo ?? ""} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(aviso.texto_grupo ?? "");
                toast.success("Mensaje copiado");
              }}
            >
              <Copy /> Copiar mensaje para el grupo
            </Button>
            <div className="flex flex-wrap gap-1">
              {(aviso.whatsapp?.enlaces ?? [])
                .filter((e) => e.enlace)
                .slice(0, 30)
                .map((e) => (
                  <a key={e.nombre} href={e.enlace!} target="_blank" rel="noreferrer">
                    <Badge variant="outline">{e.nombre}</Badge>
                  </a>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" /> Documentos P7</CardTitle>
          <CardDescription>Rol y Libro de Guardia con folio y verificación.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void emitirPdf(1)} disabled={!cicloActual}>PDF Semana 1</Button>
          <Button variant="outline" onClick={() => void emitirPdf(2)} disabled={!cicloActual}>PDF Semana 2</Button>
          <Button variant="outline" onClick={() => void emitirPdf(null)} disabled={!cicloActual}>PDF del ciclo completo</Button>
        </CardContent>
      </Card>

      <SituacionesGuardia />

      <NuevoCicloDialog abierto={nuevo} onCambio={setNuevo} onCreado={recargar} />
    </div>
  );
}

function NuevoCicloDialog({
  abierto,
  onCambio,
  onCreado,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  onCreado: () => Promise<void>;
}) {
  const proximoLunes = React.useMemo(() => {
    const d = new Date();
    const dia = d.getDay();
    const suma = dia === 1 ? 0 : (8 - dia) % 7 || 7;
    d.setDate(d.getDate() + suma);
    return d.toISOString().slice(0, 10);
  }, []);
  const [nombre, setNombre] = React.useState("");
  const [inicio, setInicio] = React.useState(proximoLunes);
  const [cupo, setCupo] = React.useState("3");

  React.useEffect(() => {
    if (abierto && !nombre) {
      const d = new Date(`${inicio}T12:00:00`);
      setNombre(`Ciclo ${d.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}`);
    }
  }, [abierto, inicio, nombre]);

  const crear = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.operaciones.rpc("crear_ciclo_guardia", {
        p_nombre: nombre,
        p_fecha_inicio: inicio,
        p_cupo_base: Number(cupo),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast.success("Ciclo creado con 14 turnos");
      onCambio(false);
      await onCreado();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Nuevo ciclo de guardias"
      descripcion="14 días: Semana 1 y Semana 2. Los turnos se crean de 23:30 a 09:30 (10:30 fines de semana)."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => crear.mutate()} disabled={crear.isPending || !nombre}>
            Crear ciclo
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="ciclo-nombre">Nombre</Label>
          <Input id="ciclo-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="ciclo-inicio">Inicio</Label>
            <Input id="ciclo-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ciclo-cupo">Cupo por día</Label>
            <Input id="ciclo-cupo" type="number" min={1} max={20} value={cupo} onChange={(e) => setCupo(e.target.value)} />
          </div>
        </div>
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Semana 1: {formatearFecha(inicio)} al {formatearFecha(new Date(new Date(`${inicio}T12:00:00`).getTime() + 6 * 86400000))}
          <br />
          Semana 2: {formatearFecha(new Date(new Date(`${inicio}T12:00:00`).getTime() + 7 * 86400000))} al{" "}
          {formatearFecha(new Date(new Date(`${inicio}T12:00:00`).getTime() + 13 * 86400000))}
        </div>
      </div>
    </Dialog>
  );
}

function SituacionesGuardia() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["guardia", "situaciones"],
    queryFn: async () => {
      const { data, error } = await db.operaciones
        .from("guardia_situacion")
        .select("*")
        .order("creado_en", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Array<{
        id: number;
        fecha_inicio: string;
        fecha_fin: string;
        motivo: string;
        estado: string;
      }>;
    },
  });

  const resolver = useMutation({
    mutationFn: async ({ id, aprobar }: { id: number; aprobar: boolean }) => {
      const { error } = await db.operaciones.rpc("resolver_situacion_guardia", {
        p_id: id,
        p_aprobar: aprobar,
        p_respuesta: aprobar ? "Aprobada por Capitanía" : "Rechazada por Capitanía",
        p_crear_situacion: aprobar,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Solicitud resuelta");
      await queryClient.invalidateQueries({ queryKey: ["guardia", "situaciones"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Situaciones especiales (§3)</CardTitle>
        <CardDescription>Solicitudes enviadas por los bomberos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sin solicitudes.</p>}
        {(data ?? []).map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
            <div>
              <p>{s.motivo}</p>
              <p className="text-xs text-muted-foreground">
                {formatearFecha(s.fecha_inicio)} al {formatearFecha(s.fecha_fin)} · {s.estado}
              </p>
            </div>
            {s.estado === "pendiente" && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => resolver.mutate({ id: s.id, aprobar: true })}>
                  <Check /> Aprobar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => resolver.mutate({ id: s.id, aprobar: false })}>
                  <X /> Rechazar
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
