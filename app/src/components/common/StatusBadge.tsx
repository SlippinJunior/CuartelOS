import { Badge } from "@/components/ui/badge";
import { formatearFecha, semaforo, type Semaforo } from "@/lib/formato";

const ESTADOS: Record<string, { etiqueta: string; variante: "exito" | "aviso" | "peligro" | "apagado" | "secondary" }> = {
  activo: { etiqueta: "Activo", variante: "exito" },
  suspendido: { etiqueta: "Suspendido", variante: "aviso" },
  renunciado: { etiqueta: "Renunciado", variante: "apagado" },
  separado: { etiqueta: "Separado", variante: "peligro" },
  expulsado: { etiqueta: "Expulsado", variante: "peligro" },
  fallecido: { etiqueta: "Fallecido", variante: "apagado" },
  trasladado: { etiqueta: "Trasladado", variante: "apagado" },
  borrador: { etiqueta: "Borrador", variante: "apagado" },
  cerrada: { etiqueta: "Cerrada", variante: "aviso" },
  enviada: { etiqueta: "Enviada", variante: "exito" },
  anulada: { etiqueta: "Anulada", variante: "peligro" },
  anulado: { etiqueta: "Anulado", variante: "peligro" },
  abierta: { etiqueta: "Abierta", variante: "aviso" },
  en_revision: { etiqueta: "En revisión", variante: "aviso" },
  resuelta: { etiqueta: "Resuelta", variante: "exito" },
  descartada: { etiqueta: "Descartada", variante: "apagado" },
  pendiente: { etiqueta: "Pendiente", variante: "aviso" },
  cumplido: { etiqueta: "Cumplido", variante: "exito" },
  pagado: { etiqueta: "Pagado", variante: "exito" },
  devengado: { etiqueta: "Devengado", variante: "aviso" },
  comprometido: { etiqueta: "Comprometido", variante: "secondary" },
  bueno: { etiqueta: "Bueno", variante: "exito" },
  regular: { etiqueta: "Regular", variante: "aviso" },
  malo: { etiqueta: "Malo", variante: "peligro" },
  baja: { etiqueta: "Baja", variante: "apagado" },
  sin_revisar: { etiqueta: "Sin revisar", variante: "apagado" },
};

export function EstadoBadge({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <Badge variant="apagado">Sin dato</Badge>;
  const def = ESTADOS[estado] ?? { etiqueta: estado, variante: "outline" as const };
  return <Badge variant={def.variante}>{def.etiqueta}</Badge>;
}

const SEMAFORO: Record<Semaforo, { etiqueta: string; variante: "exito" | "aviso" | "peligro" | "apagado" }> = {
  al_dia: { etiqueta: "Al día", variante: "exito" },
  por_vencer: { etiqueta: "Por vencer", variante: "aviso" },
  vencido: { etiqueta: "Vencido", variante: "peligro" },
  sin_dato: { etiqueta: "Sin dato", variante: "apagado" },
};

export function SemaforoBadge({ vence, dias = 30 }: { vence: string | null | undefined; dias?: number }) {
  const estado = semaforo(vence, dias);
  const def = SEMAFORO[estado];
  return (
    <Badge variant={def.variante} title={vence ? `Vence ${formatearFecha(vence)}` : "Sin fecha"}>
      {def.etiqueta}
    </Badge>
  );
}

export function SeveridadBadge({ severidad }: { severidad: number }) {
  if (severidad <= 1) return <Badge variant="peligro">Alta</Badge>;
  if (severidad === 2) return <Badge variant="aviso">Media</Badge>;
  return <Badge variant="apagado">Baja</Badge>;
}
