import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useConexion } from "@/lib/offline/useConexion";

export function ConnectionIndicator() {
  const { enLinea, pendientes } = useConexion();

  if (!enLinea) {
    return (
      <Badge
        variant="aviso"
        className="shrink-0 whitespace-nowrap"
        title="Sin conexión: el pase de lista se guarda en el dispositivo"
      >
        <CloudOff className="size-3" aria-hidden="true" />
        <span className="hidden sm:inline">Sin conexión</span>
        <span className="sm:hidden">Offline</span>
      </Badge>
    );
  }

  if (pendientes > 0) {
    return (
      <Badge
        variant="aviso"
        className="shrink-0 whitespace-nowrap"
        title="Marcas de asistencia pendientes de sincronizar"
      >
        <RefreshCw className="size-3" aria-hidden="true" />
        <span>
          {pendientes}
          <span className="hidden sm:inline"> por sincronizar</span>
        </span>
      </Badge>
    );
  }

  return (
    <Badge variant="exito" className="hidden shrink-0 whitespace-nowrap sm:inline-flex" title="Conectado">
      <Wifi className="size-3" aria-hidden="true" /> En línea
    </Badge>
  );
}
