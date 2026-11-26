import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Banknote,
  CircleDollarSign,
  Clock3,
  Receipt,
  Settings2,
} from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearCLP, formatearFecha, fechaISO } from "@/lib/formato";
import type { CartolaDetalle, CuotaEstado, ProyeccionFila } from "@/types/tipos";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const ANIO_ACTUAL = new Date().getFullYear();

interface PersonaCuotas {
  persona_id: string;
  registro: number;
  nombre: string;
  rango: string;
  meses: Record<number, CuotaEstado>;
}

export function TesoreriaPage() {
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeEditar = roles.some((r) => ["tesorero", "protesorero", "director", "admin"].includes(r));
  const [anio, setAnio] = React.useState(String(ANIO_ACTUAL));
  const [valorAbierto, setValorAbierto] = React.useState(false);

  return (
    <div>
      <PageHeader
        titulo="Tesorería"
        descripcion="Cuotas sociales, cartola y proyección de saldo."
        acciones={
          <>
            <Select value={anio} onChange={(e) => setAnio(e.target.value)} aria-label="Año" className="w-28">
              {Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL + 1 - i).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
            {puedeEditar && (
              <Button variant="outline" onClick={() => setValorAbierto(true)}>
                <Settings2 /> Valor cuota
              </Button>
            )}
          </>
        }
      />

      <Tabs
        items={[
          {
            id: "cuotas",
            etiqueta: "Cuotas",
            contenido: <CuotasTab anio={Number(anio)} puedeEditar={puedeEditar} />,
          },
          { id: "cartola", etiqueta: "Cartola", contenido: <CartolaTab /> },
          { id: "proyeccion", etiqueta: "Proyección", contenido: <ProyeccionTab /> },
        ]}
      />

      <ValorCuotaDialog
        abierto={valorAbierto}
        onCambio={setValorAbierto}
        anio={Number(anio)}
        puedeEditar={puedeEditar}
      />
    </div>
  );
}

function CuotasTab({ anio, puedeEditar }: { anio: number; puedeEditar: boolean }) {
  const queryClient = useQueryClient();
  const [pago, setPago] = React.useState<CuotaEstado | null>(null);
  const [detalle, setDetalle] = React.useState<CuotaEstado | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["cuotas-estado", anio],
    queryFn: async () => {
      const { data, error } = await db.tesoreria.rpc("fn_cuotas_estado", { p_anio: anio });
      if (error) throw error;
      return (data ?? []) as CuotaEstado[];
    },
  });

  const personas = React.useMemo(() => {
    const mapa = new Map<string, PersonaCuotas>();
    for (const fila of data ?? []) {
      let persona = mapa.get(fila.persona_id);
      if (!persona) {
        persona = {
          persona_id: fila.persona_id,
          registro: fila.registro,
          nombre: fila.nombre,
          rango: fila.rango,
          meses: {},
        };
        mapa.set(fila.persona_id, persona);
      }
      persona.meses[Number(fila.periodo.slice(5, 7)) - 1] = fila;
    }
    return Array.from(mapa.values()).sort((a, b) => a.registro - b.registro);
  }, [data]);

  const resumen = React.useMemo(() => {
    const filas = data ?? [];
    const pagadas = filas.filter((f) => f.estado === "pagada");
    const pendientes = filas.filter((f) => f.estado === "pendiente");
    return {
      recaudado: pagadas.reduce((s, f) => s + Number(f.monto ?? 0), 0),
      pendiente: pendientes.reduce((s, f) => s + Number(f.monto_esperado ?? 0), 0),
      pagadas: pagadas.length,
      pendientes: pendientes.length,
    };
  }, [data]);

  const pagar = useMutation({
    mutationFn: async (datos: {
      persona_id: string;
      periodo: string;
      monto: number;
      fecha: string;
      medio_pago: string;
      n_documento: string;
      observacion: string;
    }) => {
      const { data, error } = await db.tesoreria.rpc("registrar_pago_cuota", {
        p_persona_id: datos.persona_id,
        p_periodo: datos.periodo,
        p_monto: datos.monto,
        p_fecha: datos.fecha,
        p_medio_pago: datos.medio_pago,
        p_n_documento: datos.n_documento || null,
        p_observacion: datos.observacion || null,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: async (movimientoId) => {
      toast.success(`Pago registrado. Movimiento #${movimientoId} agregado a la cartola.`);
      setPago(null);
      await queryClient.invalidateQueries({ queryKey: ["cuotas-estado"] });
      await queryClient.invalidateQueries({ queryKey: ["cartola"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const anular = useMutation({
    mutationFn: async ({ cuotaId, motivo }: { cuotaId: number; motivo: string }) => {
      const { error } = await db.tesoreria.rpc("anular_pago_cuota", {
        p_cuota_id: cuotaId,
        p_motivo: motivo,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Pago anulado. El movimiento quedó anulado en la cartola.");
      setDetalle(null);
      await queryClient.invalidateQueries({ queryKey: ["cuotas-estado"] });
      await queryClient.invalidateQueries({ queryKey: ["cartola"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Recaudado {anio}</p>
            <p className="mt-1 text-xl font-bold text-exito">{formatearCLP(resumen.recaudado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pendiente</p>
            <p className="mt-1 text-xl font-bold text-peligro">{formatearCLP(resumen.pendiente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
            <p className="mt-1 text-xl font-bold">{resumen.pagadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Cuotas pendientes</p>
            <p className="mt-1 text-xl font-bold">{resumen.pendientes}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-5 text-primary" /> Grilla de cuotas {anio}
          </CardTitle>
          <CardDescription>
            Toca una celda para registrar el pago. Al guardarlo se crea el ingreso en la cartola.
            E = eximido, C = condonada, — = pendiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando cuotas…</p>
          ) : personas.length === 0 ? (
            <EmptyState titulo="Sin personas activas" descripcion="No hay bomberos para mostrar en la grilla." icono={Receipt} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-separate border-spacing-0 text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-border bg-card px-2 py-2 text-left font-semibold">
                      Bombero
                    </th>
                    {MESES.map((m) => (
                      <th key={m} className="w-9 border-b border-border px-1 py-2 text-center font-semibold text-muted-foreground">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {personas.map((p) => (
                    <tr key={p.persona_id} className="hover:bg-muted/30">
                      <td className="sticky left-0 z-10 max-w-[220px] border-b border-border bg-card px-2 py-1.5">
                        <p className="truncate font-medium">
                          <span className="mr-1 font-mono text-[10px] text-muted-foreground">{p.registro}</span>
                          {p.nombre}
                        </p>
                        {p.rango === "honorario" && <span className="text-[10px] text-muted-foreground">Honorario · eximido</span>}
                      </td>
                      {MESES.map((mes, i) => {
                        const fila = p.meses[i];
                        return (
                          <td key={mes} className="border-b border-border p-0 text-center">
                            <CeldaCuota
                              fila={fila}
                              puedeEditar={puedeEditar}
                              alPagar={() => fila && setPago(fila)}
                              alVer={() => fila && setDetalle(fila)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PagoCuotaDialog
        fila={pago}
        onCambio={(v) => !v && setPago(null)}
        procesando={pagar.isPending}
        onGuardar={(datos) => pagar.mutate(datos)}
      />
      <DetalleCuotaDialog
        fila={detalle}
        onCambio={(v) => !v && setDetalle(null)}
        procesando={anular.isPending}
        onAnular={(motivo) => {
          if (detalle?.cuota_id) anular.mutate({ cuotaId: detalle.cuota_id, motivo });
        }}
      />
    </div>
  );
}

function CeldaCuota({
  fila,
  puedeEditar,
  alPagar,
  alVer,
}: {
  fila?: CuotaEstado;
  puedeEditar: boolean;
  alPagar: () => void;
  alVer: () => void;
}) {
  if (!fila) return <span className="block h-9" />;

  const base = "flex h-9 w-full items-center justify-center rounded text-[13px] font-semibold transition-colors";
  if (fila.estado === "pagada") {
    return (
      <button
        type="button"
        onClick={alVer}
        className={`${base} bg-exito/15 text-exito hover:bg-exito/25`}
        title={`Pagada: ${formatearCLP(fila.monto)}`}
      >
        ✓
      </button>
    );
  }
  if (fila.estado === "condonada") {
    return (
      <button type="button" onClick={alVer} className={`${base} bg-muted text-muted-foreground`} title="Condonada">
        C
      </button>
    );
  }
  if (fila.estado === "exento") {
    return <span className={`${base} bg-muted/60 text-muted-foreground`} title="Eximido">E</span>;
  }
  if (fila.estado === "no_aplica") {
    return <span className={`${base} text-muted-foreground/30`} title="No aplica">·</span>;
  }
  if (fila.estado === "futura") {
    return <span className={`${base} text-muted-foreground/40`} title="Mes futuro">·</span>;
  }
  return (
    <button
      type="button"
      onClick={() => (puedeEditar ? alPagar() : toast.info("Solo Tesorería puede registrar pagos."))}
      className={`${base} bg-peligro/10 text-peligro hover:bg-peligro/20`}
      title={`Pendiente: ${formatearCLP(fila.monto_esperado)}`}
    >
      —
    </button>
  );
}

function PagoCuotaDialog({
  fila,
  onCambio,
  onGuardar,
  procesando,
}: {
  fila: CuotaEstado | null;
  onCambio: (v: boolean) => void;
  onGuardar: (datos: {
    persona_id: string;
    periodo: string;
    monto: number;
    fecha: string;
    medio_pago: string;
    n_documento: string;
    observacion: string;
  }) => void;
  procesando: boolean;
}) {
  const [monto, setMonto] = React.useState("");
  const [fecha, setFecha] = React.useState(() => fechaISO(new Date()));
  const [medio, setMedio] = React.useState("transferencia");
  const [documento, setDocumento] = React.useState("");
  const [observacion, setObservacion] = React.useState("");

  React.useEffect(() => {
    if (fila) {
      setMonto(String(fila.monto_esperado || ""));
      setFecha(fechaISO(new Date()));
      setMedio("transferencia");
      setDocumento("");
      setObservacion("");
    }
  }, [fila]);

  return (
    <Dialog
      abierto={Boolean(fila)}
      onCambio={onCambio}
      titulo="Registrar pago de cuota"
      descripcion={fila ? `${fila.nombre} · ${fila.periodo.slice(5, 7)}/${fila.periodo.slice(0, 4)}` : ""}
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button
            disabled={procesando || !monto || Number(monto) <= 0}
            onClick={() => {
              if (!fila) return;
              onGuardar({
                persona_id: fila.persona_id,
                periodo: fila.periodo,
                monto: Number(monto),
                fecha,
                medio_pago: medio,
                n_documento: documento,
                observacion,
              });
            }}
          >
            {procesando ? "Registrando…" : "Registrar pago"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p className="text-muted-foreground">Al registrar el pago se creará automáticamente un ingreso en la cartola.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cuota-monto">Monto</Label>
            <Input id="cuota-monto" type="number" min={1} value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cuota-fecha">Fecha del pago</Label>
            <Input id="cuota-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cuota-medio">Medio de pago</Label>
            <Select id="cuota-medio" value={medio} onChange={(e) => setMedio(e.target.value)}>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cuota-doc">N° documento</Label>
            <Input id="cuota-doc" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="cuota-obs">Observación</Label>
          <Input id="cuota-obs" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

function DetalleCuotaDialog({
  fila,
  onCambio,
  onAnular,
  procesando,
}: {
  fila: CuotaEstado | null;
  onCambio: (v: boolean) => void;
  onAnular: (motivo: string) => void;
  procesando: boolean;
}) {
  const [motivo, setMotivo] = React.useState("");
  React.useEffect(() => setMotivo(""), [fila]);

  return (
    <Dialog
      abierto={Boolean(fila)}
      onCambio={onCambio}
      titulo="Detalle de cuota"
      descripcion={fila ? `${fila.nombre} · ${fila.periodo.slice(5, 7)}/${fila.periodo.slice(0, 4)}` : ""}
      pie={<Button variant="outline" onClick={() => onCambio(false)}>Cerrar</Button>}
    >
      {fila && (
        <div className="space-y-4 text-sm">
          <dl className="space-y-2">
            <div className="flex justify-between"><dt className="text-muted-foreground">Estado</dt><dd className="capitalize">{fila.estado}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Monto pagado</dt><dd>{formatearCLP(fila.monto)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Movimiento de cartola</dt><dd>{fila.movimiento_id ? `#${fila.movimiento_id}` : "—"}</dd></div>
          </dl>
          {fila.cuota_id && (
            <div className="space-y-2 rounded-md border border-peligro/30 p-3">
              <p className="font-medium text-peligro">Anular este pago</p>
              <p className="text-xs text-muted-foreground">Se anulará la cuota y su movimiento en la cartola. La acción queda auditada.</p>
              <Input placeholder="Motivo de anulación" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              <Button
                variant="destructive"
                size="sm"
                disabled={motivo.trim().length < 3 || procesando}
                onClick={() => onAnular(motivo)}
              >
                {procesando ? "Anulando…" : "Anular pago"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

function ValorCuotaDialog({
  abierto,
  onCambio,
  anio,
  puedeEditar,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  anio: number;
  puedeEditar: boolean;
}) {
  const queryClient = useQueryClient();
  const [monto, setMonto] = React.useState("");

  const { data: valor } = useQuery({
    queryKey: ["cuota-valor", anio],
    queryFn: async () => {
      const { data, error } = await db.tesoreria
        .from("cuota_valor")
        .select("*")
        .eq("anio", anio)
        .order("vigente_desde", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { monto: number } | null;
    },
  });

  React.useEffect(() => {
    if (abierto && valor) setMonto(String(valor.monto));
  }, [abierto, valor]);

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.tesoreria.from("cuota_valor").upsert(
        { anio, monto: Number(monto), vigente_desde: `${anio}-01-01` } as never,
        { onConflict: "anio,vigente_desde" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Valor de cuota actualizado");
      onCambio(false);
      await queryClient.invalidateQueries({ queryKey: ["cuota-valor"] });
      await queryClient.invalidateQueries({ queryKey: ["cuotas-estado"] });
      await queryClient.invalidateQueries({ queryKey: ["mi-cuotas"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo={`Valor de la cuota ${anio}`}
      descripcion="Se usa para completar los pagos cuando no se indica un monto."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cerrar</Button>
          {puedeEditar && (
            <Button onClick={() => guardar.mutate()} disabled={!monto || guardar.isPending}>
              Guardar
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="valor-cuota">Monto mensual (CLP)</Label>
        <Input
          id="valor-cuota"
          type="number"
          min={0}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          disabled={!puedeEditar}
        />
        <p className="text-xs text-muted-foreground">
          Los bomberos honorarios se muestran como eximidos (art. 49).
        </p>
      </div>
    </Dialog>
  );
}

function CartolaTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["cartola"],
    queryFn: async () => {
      const { data, error } = await db.tesoreria
        .from("v_cartola_detalle")
        .select("*")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false })
        .limit(150);
      if (error) throw error;
      return (data ?? []) as CartolaDetalle[];
    },
  });

  const saldo = data?.[0] ? Number(data[0].saldo) : 0;
  const mesActual = new Date().toISOString().slice(0, 7);
  const delMes = (data ?? []).filter((m) => m.fecha.startsWith(mesActual) && !m.anulado);
  const ingresos = delMes.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const egresos = delMes.filter((m) => m.tipo === "egreso").reduce((s, m) => s + Number(m.monto), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Saldo en cartola</p>
            <p className="mt-1 text-xl font-bold">{formatearCLP(saldo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Ingresos del mes</p>
            <p className="mt-1 text-xl font-bold text-exito">{formatearCLP(ingresos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Egresos del mes</p>
            <p className="mt-1 text-xl font-bold text-peligro">{formatearCLP(egresos)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="size-5 text-primary" /> Cartola
          </CardTitle>
          <CardDescription>
            Los pagos de cuotas se agregan aquí automáticamente. Los movimientos no se borran: se anulan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando cartola…</p>
          ) : (data ?? []).length === 0 ? (
            <EmptyState titulo="Sin movimientos" descripcion="Aún no hay ingresos ni egresos registrados." icono={CircleDollarSign} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2">Glosa</th>
                    <th className="px-2 py-2">Categoría</th>
                    <th className="px-2 py-2">Medio</th>
                    <th className="px-2 py-2 text-right">Monto</th>
                    <th className="px-2 py-2 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((m) => (
                    <tr key={m.id} className={`border-b border-border ${m.anulado ? "opacity-60" : ""}`}>
                      <td className="whitespace-nowrap px-2 py-2">{formatearFecha(m.fecha)}</td>
                      <td className="px-2 py-2">
                        <p>{m.glosa}</p>
                        {m.anulado && <Badge variant="peligro">Anulado · {m.motivo_anulacion}</Badge>}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{m.categoria ?? "—"}</td>
                      <td className="px-2 py-2 capitalize text-muted-foreground">{m.medio_pago}</td>
                      <td className={`px-2 py-2 text-right font-medium ${m.anulado ? "line-through" : m.tipo === "ingreso" ? "text-exito" : "text-peligro"}`}>
                        {m.tipo === "ingreso" ? "+" : "−"}{formatearCLP(m.monto)}
                      </td>
                      <td className="px-2 py-2 text-right">{formatearCLP(m.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProyeccionTab() {
  const { data } = useQuery({
    queryKey: ["proyeccion", 6],
    queryFn: async () => {
      const { data, error } = await db.tesoreria.rpc("fn_proyeccion", { p_meses: 6, p_escenario_id: null });
      if (error) throw error;
      return (data ?? []) as ProyeccionFila[];
    },
  });

  const filas = data ?? [];
  const max = Math.max(...filas.map((f) => Number(f.saldo_proyectado)), 1);
  const min = Math.min(...filas.map((f) => Number(f.saldo_proyectado)), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="size-5 text-primary" /> Saldo proyectado
        </CardTitle>
        <CardDescription>
          Saldo actual + recurrentes + compromisos, según <code>tesoreria.fn_proyeccion</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos para proyectar.</p>
        ) : (
          <>
            <div className="flex h-56 items-end gap-3">
              {filas.map((f) => {
                const valor = Number(f.saldo_proyectado);
                const altura = 20 + ((valor - min + 100000) / (max - min + 200000)) * 80;
                return (
                  <div key={f.mes} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{formatearCLP(valor)}</span>
                    <div className={`w-full rounded-t-md ${valor >= 0 ? "bg-primary/80" : "bg-peligro/80"}`} style={{ height: `${Math.min(Math.max(altura, 5), 100)}%` }} />
                    <span className="text-xs font-medium">{formatearFecha(f.mes).slice(3, 10)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-2 py-2">Mes</th>
                    <th className="px-2 py-2 text-right">Ingresos</th>
                    <th className="px-2 py-2 text-right">Egresos</th>
                    <th className="px-2 py-2 text-right">Compromisos</th>
                    <th className="px-2 py-2 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.mes} className="border-b border-border">
                      <td className="px-2 py-2">{formatearFecha(f.mes)}</td>
                      <td className="px-2 py-2 text-right text-exito">{formatearCLP(f.ingresos)}</td>
                      <td className="px-2 py-2 text-right text-peligro">{formatearCLP(f.egresos)}</td>
                      <td className="px-2 py-2 text-right text-aviso">{formatearCLP(f.compromisos)}</td>
                      <td className="px-2 py-2 text-right font-medium">{formatearCLP(f.saldo_proyectado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
