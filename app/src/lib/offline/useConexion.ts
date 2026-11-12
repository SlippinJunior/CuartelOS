import * as React from "react";
import { contarPendientes } from "@/lib/offline/db";

export function useConexion() {
  const [enLinea, setEnLinea] = React.useState(() => navigator.onLine);
  const [pendientes, setPendientes] = React.useState(0);

  React.useEffect(() => {
    const alConectar = () => setEnLinea(true);
    const alDesconectar = () => setEnLinea(false);
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
    };
  }, []);

  React.useEffect(() => {
    let vivo = true;
    const actualizar = () => {
      contarPendientes()
        .then((n) => vivo && setPendientes(n))
        .catch(() => undefined);
    };
    actualizar();
    const intervalo = window.setInterval(actualizar, 10_000);
    window.addEventListener("erp-pendientes", actualizar);
    return () => {
      vivo = false;
      window.clearInterval(intervalo);
      window.removeEventListener("erp-pendientes", actualizar);
    };
  }, [enLinea]);

  const refrescarPendientes = React.useCallback(
    () => contarPendientes().then(setPendientes),
    [],
  );

  return { enLinea, pendientes, refrescarPendientes };
}
