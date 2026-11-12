import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useConexion } from "@/lib/offline/useConexion";

export function ConnectionIndicator() {
  const { enLinea, pendientes } = useConexion();

  if (!enLinea) {
    return (
      <Badge variant="aviso" title="Sin conexión: el pase de lista se guarda en el dispositivo">
        <CloudOff className="size-3" /> Sin conexión
      </Badge>
    );
  }

  if (pendientes > 0) {
    return (
      <Badge variant="aviso" title="Marcas de asistencia pendientes de sincronizar">
        <RefreshCw className="size-3" /> {pendientes} por sincronizar
      </Badge>
    );
  }

  return (
    <Badge variant="exito" className="hidden sm:inline-flex" title="Conectado">
      <Wifi className="size-3" /> En línea
    </Badge>
  );
}
