import { useQuery } from "@tanstack/react-query";
import { Banknote } from "lucide-react";
import { db } from "@/lib/supabase";
import { usePerfil } from "@/features/auth/sesion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearCLP, formatearFecha } from "@/lib/formato";
import type { CampanaParticipacion, CuotaPago, CuotaValor } from "@/types/tipos";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function MiTesoreriaPage() {
  const { data: perfil } = usePerfil();
  const personaId = perfil?.persona?.id;
  const anio = new Date().getFullYear();

  const cuotasQ = useQuery({
    queryKey: ["mis-cuotas", personaId],
    queryFn: async () => {
      const { data, error } = await db.tesoreria
        .from("cuota_pago")
        .select("*")
        .eq("persona_id", personaId)
        .order("periodo", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CuotaPago[];
    },
    enabled: Boolean(personaId),
  });

  const valorQ = useQuery({
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
      return data as CuotaValor | null;
    },
  });

  const campanaQ = useQuery({
    queryKey: ["mi-campana", personaId],
    queryFn: async () => {
      const { data, error } = await db.tesoreria
        .from("campana_participacion")
        .select("*")
        .eq("persona_id", personaId)
        .order("campana_id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as CampanaParticipacion | null;
    },
    enabled: Boolean(personaId),
  });

  if (!personaId) {
    return <EmptyState titulo="Sin ficha vinculada" descripcion="Tu usuario no está asociado a una persona." icono={Banknote} />;
  }

  const delAnio = (cuotasQ.data ?? []).filter((c) => c.periodo.startsWith(String(anio)));
  const pagadas = delAnio.length;
  const transcurridos = new Date().getMonth() + 1;
  const valor = valorQ.data?.monto ?? 0;
  const pendientes = Math.max(transcurridos - pagadas, 0);
  const deuda = pendientes * valor;

  return (
    <div>
      <PageHeader
        titulo="Mis cuotas"
        descripcion={`Cuotas sociales y campaña económica del año ${anio}.`}
        volverA="/"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Cuotas pagadas</p>
            <p className="mt-1 text-2xl font-bold">{pagadas} / {transcurridos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Deuda estimada</p>
            <p className="mt-1 text-2xl font-bold">{formatearCLP(deuda)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Saldo de campaña</p>
            <p className="mt-1 text-2xl font-bold">
              {campanaQ.data ? formatearCLP(campanaQ.data.aporte_adicional + campanaQ.data.saldo_arrastre) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Cuotas del año</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MESES.map((mes, i) => {
              const pagada = delAnio.some((c) => Number(c.periodo.slice(5, 7)) - 1 === i && !c.condonada);
              const vencida = i + 1 < transcurridos;
              return (
                <div key={mes} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                  <span>{mes}</span>
                  {pagada ? (
                    <Badge variant="exito">Pagada</Badge>
                  ) : vencida ? (
                    <Badge variant="peligro">Pendiente</Badge>
                  ) : (
                    <Badge variant="apagado">—</Badge>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Valor de la cuota {anio}: {formatearCLP(valor)}. Los pagos se registran en Tesorería y se vinculan a un
            movimiento de la cartola.
          </p>
        </CardContent>
      </Card>

      {delAnio.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2"><CardTitle>Pagos registrados</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {delAnio.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
                <span>{formatearFecha(c.periodo)}</span>
                <span>{formatearCLP(c.monto)}</span>
                {c.exento || c.condonada ? <Badge variant="apagado">Exenta</Badge> : <Badge variant="exito">Pagada</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
