import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Cargo, Curso, PremioTipo } from "@/types/tipos";

interface BaseProps {
  personaId: string;
  abierto: boolean;
  onCambio: (v: boolean) => void;
}

function useGuardar(personaId: string, cerrar: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tabla, datos }: { tabla: string; datos: Record<string, unknown> }) => {
      const { error } = await db.personal.from(tabla as never).insert(datos as never);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Registro guardado");
      await queryClient.invalidateQueries({ queryKey: ["persona", personaId] });
      cerrar();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });
}

export function DialogoEvento({ personaId, abierto, onCambio }: BaseProps) {
  const [tipo, setTipo] = React.useState("cambio_estado");
  const [rango, setRango] = React.useState("");
  const [estado, setEstado] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = React.useState("");
  const guardar = useGuardar(personaId, () => onCambio(false));

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Registrar evento de estado"
      descripcion="El evento es la fuente de verdad: actualiza el rango y estado de la ficha."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button
            disabled={guardar.isPending}
            onClick={() =>
              guardar.mutate({
                tabla: "persona_evento",
                datos: {
                  persona_id: personaId,
                  tipo,
                  rango: rango || null,
                  estado: estado || null,
                  fecha,
                  motivo: motivo || null,
                },
              })
            }
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="ev-tipo">Tipo</Label>
          <Select id="ev-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="cambio_estado">Cambio de estado</option>
            <option value="cambio_rango">Cambio de rango</option>
            <option value="reincorporacion">Reincorporación</option>
            <option value="traslado">Traslado</option>
            <option value="otro">Otro</option>
          </Select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ev-rango">Nuevo rango</Label>
            <Select id="ev-rango" value={rango} onChange={(e) => setRango(e.target.value)}>
              <option value="">Sin cambio</option>
              <option value="aspirante">Aspirante</option>
              <option value="bombero">Bombero</option>
              <option value="honorario">Honorario</option>
              <option value="insigne">Insigne</option>
              <option value="martir">Mártir</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ev-estado">Nuevo estado</Label>
            <Select id="ev-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Sin cambio</option>
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
              <option value="renunciado">Renunciado</option>
              <option value="separado">Separado</option>
              <option value="fallecido">Fallecido</option>
              <option value="trasladado">Trasladado</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ev-fecha">Fecha</Label>
          <Input id="ev-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ev-motivo">Motivo</Label>
          <Textarea id="ev-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

export function DialogoCargo({ personaId, abierto, onCambio }: BaseProps) {
  const [cargoId, setCargoId] = React.useState("");
  const [desde, setDesde] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [hasta, setHasta] = React.useState("");
  const { data: cargos } = useQuery({
    queryKey: ["cargos"],
    queryFn: async () => {
      const { data, error } = await db.personal.from("cargo").select("*").order("orden");
      if (error) throw error;
      return (data ?? []) as Cargo[];
    },
    enabled: abierto,
  });
  const guardar = useGuardar(personaId, () => onCambio(false));

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Asignar cargo"
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button
            disabled={!cargoId || guardar.isPending}
            onClick={() =>
              guardar.mutate({
                tabla: "cargo_periodo",
                datos: { persona_id: personaId, cargo_id: Number(cargoId), desde, hasta: hasta || null },
              })
            }
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="cg-cargo">Cargo</Label>
          <Select id="cg-cargo" value={cargoId} onChange={(e) => setCargoId(e.target.value)}>
            <option value="">Seleccionar…</option>
            {cargos?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cg-desde">Desde</Label>
            <Input id="cg-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cg-hasta">Hasta</Label>
            <Input id="cg-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function DialogoCurso({ personaId, abierto, onCambio }: BaseProps) {
  const [cursoId, setCursoId] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const { data: cursos } = useQuery({
    queryKey: ["cursos"],
    queryFn: async () => {
      const { data, error } = await db.personal.from("curso").select("*").order("nombre");
      if (error) throw error;
      return (data ?? []) as Curso[];
    },
    enabled: abierto,
  });
  const guardar = useGuardar(personaId, () => onCambio(false));

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Registrar curso aprobado"
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button
            disabled={!cursoId || guardar.isPending}
            onClick={() =>
              guardar.mutate({
                tabla: "persona_curso",
                datos: { persona_id: personaId, curso_id: Number(cursoId), fecha_aprobacion: fecha },
              })
            }
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="cu-curso">Curso</Label>
          <Select id="cu-curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
            <option value="">Seleccionar…</option>
            {cursos?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="cu-fecha">Fecha de aprobación</Label>
          <Input id="cu-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

export function DialogoPremio({ personaId, abierto, onCambio }: BaseProps) {
  const [tipoId, setTipoId] = React.useState("");
  const [anios, setAnios] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const { data: tipos } = useQuery({
    queryKey: ["premio-tipos"],
    queryFn: async () => {
      const { data, error } = await db.personal.from("premio_tipo").select("*").order("nombre");
      if (error) throw error;
      return (data ?? []) as PremioTipo[];
    },
    enabled: abierto,
  });
  const guardar = useGuardar(personaId, () => onCambio(false));

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Registrar premio"
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button
            disabled={!tipoId || guardar.isPending}
            onClick={() =>
              guardar.mutate({
                tabla: "persona_premio",
                datos: {
                  persona_id: personaId,
                  premio_tipo_id: Number(tipoId),
                  anios: anios ? Number(anios) : null,
                  fecha,
                  otorgado_por: "Compañía",
                },
              })
            }
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="pr-tipo">Tipo de premio</Label>
          <Select id="pr-tipo" value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
            <option value="">Seleccionar…</option>
            {tipos?.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="pr-anios">Años</Label>
            <Input id="pr-anios" type="number" min={0} value={anios} onChange={(e) => setAnios(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pr-fecha">Fecha</Label>
            <Input id="pr-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function DialogoLicencia({ personaId, abierto, onCambio }: BaseProps) {
  const [clase, setClase] = React.useState("B");
  const [numero, setNumero] = React.useState("");
  const [vence, setVence] = React.useState("");
  const guardar = useGuardar(personaId, () => onCambio(false));

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Licencia de conducir"
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button
            disabled={guardar.isPending}
            onClick={() =>
              guardar.mutate({
                tabla: "licencia_conducir",
                datos: { persona_id: personaId, clase, numero: numero || null, vence: vence || null },
              })
            }
          >
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="lc-clase">Clase</Label>
            <Input id="lc-clase" value={clase} onChange={(e) => setClase(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lc-numero">Número</Label>
            <Input id="lc-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="lc-vence">Vence</Label>
          <Input id="lc-vence" type="date" value={vence} onChange={(e) => setVence(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

export function DialogoSensible({
  personaId,
  abierto,
  onCambio,
  inicial,
}: BaseProps & { inicial?: Record<string, string | null> | null }) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    grupo_sanguineo: inicial?.grupo_sanguineo ?? "",
    alergias: inicial?.alergias ?? "",
    condiciones: inicial?.condiciones ?? "",
    medicamentos: inicial?.medicamentos ?? "",
    contacto_emergencia_nombre: inicial?.contacto_emergencia_nombre ?? "",
    contacto_emergencia_telefono: inicial?.contacto_emergencia_telefono ?? "",
    notas: inicial?.notas ?? "",
  });

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.personal.from("persona_dato_sensible").upsert(
        {
          persona_id: personaId,
          ...form,
          alergias: form.alergias || null,
          condiciones: form.condiciones || null,
          medicamentos: form.medicamentos || null,
          notas: form.notas || null,
          actualizado_en: new Date().toISOString(),
        } as never,
        { onConflict: "persona_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Datos sensibles guardados");
      await queryClient.invalidateQueries({ queryKey: ["sensible", personaId] });
      onCambio(false);
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Datos sensibles"
      descripcion="Salud y contacto de emergencia. Cada lectura queda auditada."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="ds-grupo">Grupo sanguíneo</Label>
            <Input id="ds-grupo" value={form.grupo_sanguineo} onChange={(e) => setForm({ ...form, grupo_sanguineo: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ds-alergias">Alergias</Label>
            <Input id="ds-alergias" value={form.alergias} onChange={(e) => setForm({ ...form, alergias: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ds-condiciones">Condiciones médicas</Label>
          <Textarea id="ds-condiciones" value={form.condiciones} onChange={(e) => setForm({ ...form, condiciones: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ds-medicamentos">Medicamentos</Label>
          <Input id="ds-medicamentos" value={form.medicamentos} onChange={(e) => setForm({ ...form, medicamentos: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="ds-contacto">Contacto de emergencia</Label>
            <Input id="ds-contacto" value={form.contacto_emergencia_nombre} onChange={(e) => setForm({ ...form, contacto_emergencia_nombre: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ds-telefono">Teléfono</Label>
            <Input id="ds-telefono" value={form.contacto_emergencia_telefono} onChange={(e) => setForm({ ...form, contacto_emergencia_telefono: e.target.value })} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
