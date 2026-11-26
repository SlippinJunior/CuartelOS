import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, PackagePlus, Send, UserPlus, X } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cantidadLegible, describirArticulo } from "@/features/material/logica";
import type { Articulo, EstadoSolicitud, PanolStock, SolicitudMaterial } from "@/types/tipos";

const ESTADOS_ITEM = ["bueno", "regular", "malo", "baja", "sin_revisar"] as const;

export interface PersonaOpcion {
  id: string;
  registro: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rango: string;
}

const hoy = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------
// Alta y edición de stock del pañol
// ---------------------------------------------------------------------
export function DialogoStock({
  abierto,
  stock,
  articulos,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  stock: PanolStock | null;
  articulos: Articulo[];
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}) {
  const [articuloId, setArticuloId] = React.useState("");
  const [talla, setTalla] = React.useState("");
  const [cantidad, setCantidad] = React.useState("0");
  const [minimo, setMinimo] = React.useState("0");
  const [ubicacion, setUbicacion] = React.useState("Inventario Compañía");
  const [estado, setEstado] = React.useState<string>("bueno");
  const [observacion, setObservacion] = React.useState("");

  React.useEffect(() => {
    if (!abierto) return;
    setArticuloId(stock ? String(stock.articulo_id) : "");
    setTalla(stock?.talla ?? "");
    setCantidad(stock ? String(stock.cantidad) : "0");
    setMinimo(stock ? String(stock.minimo) : "0");
    setUbicacion(stock?.ubicacion ?? "Inventario Compañía");
    setEstado(stock?.estado ?? "bueno");
    setObservacion(stock?.observacion ?? "");
  }, [abierto, stock]);

  const guardar = useMutation({
    mutationFn: async () => {
      const datos = {
        articulo_id: Number(articuloId),
        talla: talla.trim() || null,
        cantidad: Number(cantidad),
        minimo: Number(minimo),
        ubicacion: ubicacion.trim() || "Inventario Compañía",
        estado,
        observacion: observacion.trim() || null,
      };
      if (stock) {
        const { error } = await db.material.from("panol_stock").update(datos).eq("id", stock.id);
        if (error) throw error;
      } else {
        const { error } = await db.material.from("panol_stock").insert(datos);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(stock ? "Stock actualizado" : "Artículo agregado a Inventario Compañía");
      onCerrar();
      await onGuardado();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const valido = articuloId && Number(cantidad) >= 0 && Number(minimo) >= 0;

  return (
    <Dialog
      abierto={abierto}
      onCambio={(v) => !v && onCerrar()}
      titulo={stock ? "Editar stock de Inventario Compañía" : "Agregar artículo a Inventario Compañía"}
      descripcion="Solo el Teniente 2° administra estas existencias."
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={!valido || guardar.isPending}>
            <PackagePlus /> Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="stock-articulo">Artículo</Label>
          <Select
            id="stock-articulo"
            value={articuloId}
            onChange={(e) => setArticuloId(e.target.value)}
            disabled={Boolean(stock)}
          >
            <option value="">Selecciona un artículo</option>
            {articulos.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </Select>
          {stock && (
            <p className="text-xs text-muted-foreground">
              El artículo no se cambia: crea otra fila para una talla distinta.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="stock-talla">Talla o variante</Label>
            <Input
              id="stock-talla"
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              placeholder="L, 41, única…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock-ubicacion">Ubicación</Label>
            <Input id="stock-ubicacion" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock-cantidad">Cantidad disponible</Label>
            <Input
              id="stock-cantidad"
              type="number"
              min={0}
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock-minimo">Mínimo para reponer</Label>
            <Input
              id="stock-minimo"
              type="number"
              min={0}
              step="1"
              value={minimo}
              onChange={(e) => setMinimo(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock-estado">Estado</Label>
          <Select id="stock-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS_ITEM.map((e) => (
              <option key={e} value={e} className="capitalize">{e.replace("_", " ")}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock-obs">Observación</Label>
          <Textarea id="stock-obs" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Solicitud de un bombero
// ---------------------------------------------------------------------
export function DialogoSolicitud({
  stock,
  miPersonaId,
  onCerrar,
  onSolicitado,
}: {
  stock: PanolStock | null;
  miPersonaId: string | null;
  onCerrar: () => void;
  onSolicitado: () => Promise<void>;
}) {
  const [cantidad, setCantidad] = React.useState("1");
  const [motivo, setMotivo] = React.useState("");

  React.useEffect(() => {
    if (stock) {
      setCantidad("1");
      setMotivo("");
    }
  }, [stock]);

  const solicitar = useMutation({
    mutationFn: async () => {
      const { error } = await db.material.from("solicitud").insert({
        persona_id: miPersonaId,
        stock_id: stock!.id,
        articulo_id: stock!.articulo_id,
        talla: stock!.talla,
        cantidad: Number(cantidad),
        motivo: motivo.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Solicitud enviada al Teniente 2°");
      onCerrar();
      await onSolicitado();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const maximo = stock?.cantidad ?? 0;
  const valido = Boolean(miPersonaId) && Number(cantidad) > 0 && Number(cantidad) <= maximo;

  return (
    <Dialog
      abierto={Boolean(stock)}
      onCambio={(v) => !v && onCerrar()}
      titulo="Solicitar a Inventario Compañía"
      descripcion={
        stock
          ? `${describirArticulo(stock.articulo, stock.talla, stock.cantidad)} disponibles en ${stock.ubicacion}.`
          : undefined
      }
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button onClick={() => solicitar.mutate()} disabled={!valido || solicitar.isPending}>
            <Send /> Enviar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="solicitud-cantidad">Cantidad</Label>
          <Input
            id="solicitud-cantidad"
            type="number"
            min={1}
            max={maximo}
            step="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Disponible ahora: {cantidadLegible(maximo)}.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="solicitud-motivo">Para qué lo necesitas</Label>
          <Textarea
            id="solicitud-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: reposición de EPP para la guardia del viernes."
          />
        </div>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Resolución del Teniente 2°
// ---------------------------------------------------------------------
export function DialogoResolver({
  solicitud,
  onCerrar,
  onResuelto,
}: {
  solicitud: SolicitudMaterial | null;
  onCerrar: () => void;
  onResuelto: () => Promise<void>;
}) {
  const [decision, setDecision] = React.useState<EstadoSolicitud>("entregada");
  const [respuesta, setRespuesta] = React.useState("");

  React.useEffect(() => {
    if (solicitud) {
      setDecision("entregada");
      setRespuesta("");
    }
  }, [solicitud]);

  const resolver = useMutation({
    mutationFn: async () => {
      const { error } = await db.material.rpc("resolver_solicitud", {
        p_solicitud_id: solicitud!.id,
        p_decision: decision,
        p_respuesta: respuesta.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(
        decision === "entregada" ? "Entrega registrada y stock descontado"
          : decision === "aprobada" ? "Solicitud aprobada"
            : "Solicitud rechazada",
      );
      onCerrar();
      await onResuelto();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={Boolean(solicitud)}
      onCambio={(v) => !v && onCerrar()}
      titulo={`Solicitud de ${solicitud?.solicitante ?? ""}`}
      descripcion={
        solicitud
          ? `${describirArticulo(solicitud.articulo, solicitud.talla, solicitud.cantidad)} · ${solicitud.motivo ?? "sin motivo indicado"}`
          : undefined
      }
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button
            variant={decision === "rechazada" ? "destructive" : "default"}
            onClick={() => resolver.mutate()}
            disabled={resolver.isPending}
          >
            {decision === "rechazada" ? <X /> : decision === "aprobada" ? <Check /> : <PackagePlus />}
            {decision === "rechazada" ? "Rechazar" : decision === "aprobada" ? "Aprobar" : "Registrar entrega"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="resolver-decision">Decisión</Label>
          <Select
            id="resolver-decision"
            value={decision}
            onChange={(e) => setDecision(e.target.value as EstadoSolicitud)}
          >
            <option value="entregada">Entregar ahora (descuenta stock)</option>
            <option value="aprobada">Aprobar y entregar después</option>
            <option value="rechazada">Rechazar</option>
          </Select>
          {decision === "entregada" && (
            <p className="text-xs text-muted-foreground">
              Se descuenta de Inventario Compañía y queda como EPP a cargo del bombero.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resolver-respuesta">Respuesta para el bombero</Label>
          <Textarea
            id="resolver-respuesta"
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            placeholder="Opcional: horario de retiro, motivo del rechazo…"
          />
        </div>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Asignación de EPP a un bombero
// ---------------------------------------------------------------------
export function DialogoAsignacion({
  abierto,
  personas,
  articulos,
  onCerrar,
  onCreada,
}: {
  abierto: boolean;
  personas: PersonaOpcion[];
  articulos: Articulo[];
  onCerrar: () => void;
  onCreada: () => Promise<void>;
}) {
  const [personaId, setPersonaId] = React.useState("");
  const [articuloId, setArticuloId] = React.useState("");
  const [cantidad, setCantidad] = React.useState("1");
  const [talla, setTalla] = React.useState("");
  const [observacion, setObservacion] = React.useState("");

  React.useEffect(() => {
    if (!abierto) return;
    setPersonaId("");
    setArticuloId("");
    setCantidad("1");
    setTalla("");
    setObservacion("");
  }, [abierto]);

  const asignar = useMutation({
    mutationFn: async () => {
      const { error } = await db.material.from("asignacion").insert({
        persona_id: personaId,
        articulo_id: Number(articuloId),
        cantidad: Number(cantidad),
        talla: talla.trim() || null,
        fecha_entrega: hoy(),
        observacion: observacion.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("EPP asignado al bombero");
      onCerrar();
      await onCreada();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const valido = personaId && articuloId && Number(cantidad) > 0;

  return (
    <Dialog
      abierto={abierto}
      onCambio={(v) => !v && onCerrar()}
      titulo="Asignar EPP o vestuario"
      descripcion="Queda en la hoja de cargo del bombero."
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button onClick={() => asignar.mutate()} disabled={!valido || asignar.isPending}>
            <UserPlus /> Asignar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="asig-persona">Bombero</Label>
          <Select id="asig-persona" value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
            <option value="">Selecciona una persona</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.registro} · {p.nombres} {p.apellido_paterno}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="asig-articulo">Artículo</Label>
          <Select id="asig-articulo" value={articuloId} onChange={(e) => setArticuloId(e.target.value)}>
            <option value="">Selecciona un artículo</option>
            {articulos.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="asig-cantidad">Cantidad</Label>
            <Input
              id="asig-cantidad"
              type="number"
              min={1}
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asig-talla">Talla</Label>
            <Input id="asig-talla" value={talla} onChange={(e) => setTalla(e.target.value)} placeholder="L, 41…" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="asig-obs">Observación</Label>
          <Textarea id="asig-obs" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}
