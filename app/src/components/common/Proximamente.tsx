import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export function Proximamente({
  titulo,
  descripcion,
  alcance,
  documento,
}: {
  titulo: string;
  descripcion: string;
  alcance: string[];
  documento: string;
}) {
  return (
    <div>
      <PageHeader titulo={titulo} descripcion={descripcion} />
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-aviso/15 text-aviso">
            <Hammer className="size-6" />
          </div>
          <CardTitle>Módulo en construcción</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            La base de datos ya tiene las tablas y permisos. Esta pantalla queda como esqueleto en la Etapa 1; la
            funcionalidad completa llega en una etapa posterior.
          </p>
          <div>
            <p className="mb-1 font-medium">Alcance comprometido</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {alcance.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-3 text-muted-foreground">
            Documentación del módulo: <code>docs/modulos/{documento}</code>
          </div>
          <Link to="/"><Button variant="outline">Volver al inicio</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
