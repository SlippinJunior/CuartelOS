import * as React from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, CloudOff, MoreHorizontal, RefreshCw, Send, XCircle } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EstadoBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useConexion } from "@/lib/offline/useConexion";
import {
  cachearLista,
  claveMarca,
  guardarMarcaLocal,
  leerListaLocal,
  marcarSincronizada,
  pendientesDeLista,
} from "@/lib/offline/db";
import { nucleoNormalizar } from "@/lib/texto";
import { formatearFecha } from "@/lib/formato";
import type { Asistencia, Lista, Marca, Persona, SituacionEspecial } from "@/types/tipos";

const SUGERENCIA: Record<string, { marca: Marca; texto: string }> = {
  licencia_medica: { marca: "L", texto: "licencia médica" },
  embarazo: { marca: "L", texto: "embarazo" },
  suspension: { marca: "S", texto: "suspensión" },
  permiso_especial: { marca: "P", texto: "permiso especial" },
  comision: { marca: "P", texto: "comisión" },
  accidente: { marca: "L", texto: "accidente" },
};

export function ListaPage() {
  const { listaId } = useParams({ strict: false }) as { listaId: string };
  const id = Number(listaId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enLinea, refrescarPendientes } = useConexion();

  const [lista, setLista] = React.useState<Lista | null>(null);
  const [personas, setPersonas] = React.useState<Persona[]>([]);
  const [marcas, setMarcas] = React.useState<Record<string, Marca>>({});
  const [situaciones, setSituaciones] = React.useState<SituacionEspecial[]>([]);
  const [cargandoLocal, setCargandoLocal] = React.useState(true);
  const [busqueda, setBusqueda] = React.useState("");
  const [menuPersona, setMenuPersona] = React.useState<Persona | null>(null);
  const [procesando, setProcesando] = React.useState(false);
  const [comentarios, setComentarios] = React.useState("");
  const [guardandoCom, setGuardandoCom] = React.useState(false);

  const listaQ = useQuery({
    queryKey: ["lista", id],
    queryFn: async () => {
      const { data, error } = await db.asistencia
        .from("lista")
        .select("*, tipo_acto:tipo_acto(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Lista;
    },
    enabled: Number.isFinite(id),
  });

  const personasQ = useQuery({
    queryKey: ["personas-activas"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona")
        .select("id, registro, nombres, apellido_paterno, apellido_materno, rango, estado")
        .eq("estado", "activo")
        .order("registro");
      if (error) throw error;
      return (data ?? []) as Persona[];
    },
  });

  const marcasQ = useQuery({
    queryKey: ["lista", id, "marcas"],
    queryFn: async () => {
      const { data, error } = await db.asistencia.from("asistencia").select("*").eq("lista_id", id);
      if (error) throw error;
      return (data ?? []) as Asistencia[];
    },
    enabled: Number.isFinite(id),
  });

  const situacionesQ = useQuery({
    queryKey: ["situaciones-vigentes"],
    queryFn: async () => {
      const { data, error } = await db.personal.from("situacion_especial").select("*");
      if (error) throw error;
      return (data ?? []) as SituacionEspecial[];
    },
  });

  // 1. Cargar copia local al instante (funciona sin conexión).
  React.useEffect(() => {
    let vivo = true;
    leerListaLocal(id)
      .then((local) => {
        if (!vivo || !local) return;
        setLista(local.lista);
        setPersonas(local.personas);
        setMarcas(Object.fromEntries(local.marcas.map((m) => [m.persona_id, m.marca])));
      })
      .finally(() => vivo && setCargandoLocal(false));
    return () => {
      vivo = false;
    };
  }, [id]);

  // 2. Cuando llegan datos del servidor, actualizar caché y estado.
  React.useEffect(() => {
    if (!listaQ.data || !personasQ.data || !marcasQ.data) return;
    let vivo = true;
    void cachearLista(listaQ.data, personasQ.data, marcasQ.data).then(async () => {
      if (!vivo) return;
      const local = await leerListaLocal(id);
      if (!local) return;
      setLista(local.lista);
      setPersonas(local.personas);
      setMarcas(Object.fromEntries(local.marcas.map((m) => [m.persona_id, m.marca])));
      setCargandoLocal(false);
    });
    return () => {
      vivo = false;
    };
  }, [id, listaQ.data, personasQ.data, marcasQ.data]);

  React.useEffect(() => {
    if (situacionesQ.data) setSituaciones(situacionesQ.data);
  }, [situacionesQ.data]);

  React.useEffect(() => {
    if (listaQ.data) setComentarios(listaQ.data.comentarios ?? "");
  }, [listaQ.data]);

  const guardarComentarios = async () => {
    if (!enLinea || !lista) return;
    setGuardandoCom(true);
    try {
      const { error } = await db.asistencia
        .from("lista")
        .update({ comentarios: comentarios.trim() || null } as never)
        .eq("id", lista.id);
      if (error) throw error;
      toast.success("Comentarios del parte guardados");
      await queryClient.invalidateQueries({ queryKey: ["lista", id] });
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setGuardandoCom(false);
    }
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const vigentes = React.useMemo(
    () => situaciones.filter((s) => s.desde <= hoy && (!s.hasta || s.hasta >= hoy)),
    [situaciones, hoy],
  );
  const sugerida = React.useMemo(() => {
    const mapa = new Map<string, { marca: Marca; texto: string }>();
    for (const s of vigentes) {
      const def = SUGERENCIA[s.tipo];
      if (def) mapa.set(s.persona_id, def);
    }
    return mapa;
  }, [vigentes]);

  const marcaEfectiva = (personaId: string): Marca | undefined =>
    marcas[personaId] ?? sugerida.get(personaId)?.marca;

  const sincronizar = React.useCallback(async () => {
    if (!enLinea) return;
    const pendientes = await pendientesDeLista(id);
    if (pendientes.length === 0) return;
    for (const p of pendientes) {
      try {
        const { data: servidor } = await db.asistencia
          .from("asistencia")
          .select("marca, actualizado_en")
          .eq("lista_id", id)
          .eq("persona_id", p.persona_id)
          .maybeSingle();

        const remoto = servidor as { marca: Marca; actualizado_en: string } | null;
        if (remoto && remoto.marca !== p.marca && new Date(remoto.actualizado_en).getTime() > p.actualizadoEn) {
          toast.warning("Otra persona modificó esta marca; se guardará tu versión local.");
        }

        if (lista?.estado === "borrador") {
          const { error } = await db.asistencia.from("asistencia").upsert(
            { lista_id: id, persona_id: p.persona_id, marca: p.marca, observacion: p.observacion } as never,
            { onConflict: "lista_id,persona_id" },
          );
          if (error) throw error;
        } else {
          const { error } = await supabase.schema("asistencia").rpc("corregir_marca", {
            p_lista_id: id,
            p_persona_id: p.persona_id,
            p_marca: p.marca,
            p_motivo: "Sincronización de pase de lista sin conexión",
            p_observacion: p.observacion,
          });
          if (error) throw error;
        }
        await marcarSincronizada(claveMarca(id, p.persona_id));
      } catch (e) {
        toast.error(`No se pudo sincronizar una marca: ${mensajeError(e)}`);
        return;
      }
    }
    refrescarPendientes();
  }, [enLinea, id, lista?.estado, refrescarPendientes]);

  React.useEffect(() => {
    if (enLinea) void sincronizar();
  }, [enLinea, sincronizar]);

  const marcar = async (personaId: string, marca: Marca) => {
    setMarcas((prev) => ({ ...prev, [personaId]: marca }));
    await guardarMarcaLocal(id, personaId, marca);
    await sincronizar();
    refrescarPendientes();
  };

  const marcarRestoFalta = async () => {
    const sinMarca = personas.filter((p) => !marcaEfectiva(p.id));
    if (sinMarca.length === 0) {
      toast.info("Todos los bomberos ya tienen una marca.");
      return;
    }
    const nuevas: Record<string, Marca> = { ...marcas };
    for (const p of sinMarca) {
      nuevas[p.id] = "F";
      await guardarMarcaLocal(id, p.id, "F");
    }
    setMarcas(nuevas);
    await sincronizar();
    refrescarPendientes();
    toast.success(`${sinMarca.length} marcas de falta registradas.`);
  };

  const persistirSugerencias = async () => {
    for (const [personaId, def] of sugerida) {
      if (!marcas[personaId]) {
        await guardarMarcaLocal(id, personaId, def.marca, `Premarcado por ${def.texto}`);
      }
    }
  };

  const cerrarLista = async () => {
    if (!enLinea) {
      toast.error("Necesitas conexión para cerrar la lista.");
      return;
    }
    setProcesando(true);
    try {
      await persistirSugerencias();
      await sincronizar();
      const { error } = await supabase.schema("asistencia").rpc("cerrar_lista", { p_lista_id: id });
      if (error) throw error;
      toast.success("Lista cerrada. Recuerda enviarla dentro de 48 horas.");
      await queryClient.invalidateQueries({ queryKey: ["lista", id] });
      setLista((l) => (l ? { ...l, estado: "cerrada" } : l));
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  const enviarLista = async () => {
    if (!enLinea) {
      toast.error("Necesitas conexión para enviar la lista.");
      return;
    }
    setProcesando(true);
    try {
      await persistirSugerencias();
      await sincronizar();
      const { error } = await supabase.schema("asistencia").rpc("enviar_lista", { p_lista_id: id });
      if (error) throw error;
      toast.success("Lista enviada.");
      await queryClient.invalidateQueries({ queryKey: ["lista", id] });
      setLista((l) => (l ? { ...l, estado: "enviada" } : l));
      await navigate({ to: "/asistencia" });
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  if (cargandoLocal && listaQ.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!lista) {
    return (
      <EmptyState
        titulo="Lista no disponible"
        descripcion="No se encontró en el servidor ni en la copia local."
        icono={XCircle}
        accion={<Button variant="outline" onClick={() => void navigate({ to: "/asistencia" })}>Volver</Button>}
      />
    );
  }

  const texto = nucleoNormalizar(busqueda);
  const visibles = personas.filter((p) => {
    if (!texto) return true;
    return nucleoNormalizar(`${p.nombres} ${p.apellido_paterno} ${p.apellido_materno ?? ""} ${p.registro}`).includes(texto);
  });

  const conteo = { A: 0, F: 0, P: 0, R: 0, S: 0, L: 0, sin: 0 };
  for (const p of personas) {
    const m = marcaEfectiva(p.id);
    if (m) conteo[m]++;
    else conteo.sin++;
  }

  const bloqueada = lista.estado !== "borrador";

  return (
    <div>
      <PageHeader
        titulo={`Parte N° ${lista.numero} · ${lista.tipo_acto_clave ?? "Acto"}`}
        descripcion={`${lista.tipo_acto?.descripcion ?? lista.descripcion ?? "Acto"} · ${formatearFecha(lista.fecha)}${lista.direccion ? ` · ${lista.direccion}` : ""}`}
        volverA="/asistencia"
        acciones={<EstadoBadge estado={lista.estado} />}
      />

      <Card className="mb-3">
        <CardContent className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Comentarios del parte
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              rows={2}
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Observaciones del Ayudante sobre la citación o emergencia…"
            />
            <Button
              variant="outline"
              className="sm:self-end"
              onClick={() => void guardarComentarios()}
              disabled={guardandoCom || !enLinea}
            >
              Guardar nota
            </Button>
          </div>
        </CardContent>
      </Card>

      {!enLinea && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-aviso/40 bg-aviso/10 p-3 text-sm">
          <CloudOff className="size-4 shrink-0 text-aviso" />
          Sin conexión. Las marcas se guardan en este dispositivo y se sincronizan al reconectar.
        </div>
      )}

      <div className="sticky top-14 z-10 -mx-4 mb-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="exito">A {conteo.A}</Badge>
          <Badge variant="peligro">F {conteo.F}</Badge>
          <Badge variant="aviso">P {conteo.P}</Badge>
          <Badge variant="apagado">R {conteo.R}</Badge>
          <Badge variant="apagado">S {conteo.S}</Badge>
          <Badge variant="apagado">L {conteo.L}</Badge>
          <Badge variant="outline">Sin marcar {conteo.sin}</Badge>
          <span className="ml-auto text-xs text-muted-foreground">{personas.length} bomberos</span>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          containerClassName="flex-1"
          placeholder="Buscar bombero por nombre o registro"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onLimpiar={() => setBusqueda("")}
          aria-label="Buscar bombero"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void marcarRestoFalta()}>
            <CheckCircle2 /> Marcar resto Falta
          </Button>
          {lista.estado === "borrador" && (
            <Button onClick={() => void cerrarLista()} disabled={procesando}>
              Cerrar lista
            </Button>
          )}
          {lista.estado === "cerrada" && (
            <Button onClick={() => void enviarLista()} disabled={procesando}>
              <Send /> Enviar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {visibles.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Sin bomberos que coincidan.</p>
          )}
          {visibles.map((p) => {
            const marca = marcaEfectiva(p.id);
            const sug = sugerida.get(p.id);
            return (
              <div key={p.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">{p.registro}</span>
                    {p.nombres} {p.apellido_paterno} {p.apellido_materno}
                  </p>
                  {sug && (
                    <p className="text-xs text-aviso">
                      Sugerido: {sug.marca} por {sug.texto}
                      {marca && marca !== sug.marca ? " (modificado)" : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {(["A", "F", "P"] as Marca[]).map((m) => (
                    <Button
                      key={m}
                      size="sm"
                      variant={marca === m ? "default" : "outline"}
                      className={
                        m === "A"
                          ? marca === m ? "bg-exito text-white hover:bg-exito/90" : "text-exito"
                          : m === "F"
                            ? marca === m ? "bg-peligro text-white hover:bg-peligro/90" : "text-peligro"
                            : marca === m ? "bg-aviso text-white hover:bg-aviso/90" : "text-aviso"
                      }
                      onClick={() => void marcar(p.id, m)}
                      aria-label={`Marcar ${m} a ${p.nombres}`}
                    >
                      {m}
                    </Button>
                  ))}
                  <Button variant="ghost" size="icon" onClick={() => setMenuPersona(p)} aria-label="Más marcas">
                    <MoreHorizontal />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="mt-3 text-right text-xs text-muted-foreground">
        Marca actual: {bloqueada ? "lista cerrada, las correcciones quedan auditadas" : "borrador"}
      </p>

      <Dialog
        abierto={Boolean(menuPersona)}
        onCambio={(v) => !v && setMenuPersona(null)}
        titulo={menuPersona ? `${menuPersona.nombres} ${menuPersona.apellido_paterno}` : "Otras marcas"}
        descripcion="R eximido · S suspendido · L licencia"
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { m: "R" as Marca, texto: "Eximido" },
            { m: "S" as Marca, texto: "Suspendido" },
            { m: "L" as Marca, texto: "Licencia" },
          ].map((x) => (
            <Button
              key={x.m}
              variant="outline"
              className="h-20 flex-col"
              onClick={() => {
                if (menuPersona) void marcar(menuPersona.id, x.m);
                setMenuPersona(null);
              }}
            >
              <span className="text-lg font-bold">{x.m}</span>
              <span className="text-xs text-muted-foreground">{x.texto}</span>
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          className="mt-3 w-full"
          onClick={() => {
            if (menuPersona) {
              setMarcas((prev) => {
                const copia = { ...prev };
                delete copia[menuPersona.id];
                return copia;
              });
            }
            setMenuPersona(null);
          }}
        >
          <RefreshCw /> Quitar marca local
        </Button>
      </Dialog>
    </div>
  );
}
