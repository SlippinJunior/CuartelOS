import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

/**
 * Redirección segura: navega en un efecto, no durante el render.
 * Evita bucles de montaje con rutas pathless en TanStack Router.
 */
export function Redirigir({ a }: { a: string }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    void navigate({ to: a } as never);
  }, [navigate, a]);
  return (
    <div className="flex min-h-40 items-center justify-center p-6 text-sm text-muted-foreground">
      Redirigiendo…
    </div>
  );
}
