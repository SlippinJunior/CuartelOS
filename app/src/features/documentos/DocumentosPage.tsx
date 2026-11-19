import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/tabs";
import { usePerfil } from "@/features/auth/sesion";
import { EmitidosTab } from "@/features/documentos/EmitidosTab";
import { ActasTab } from "@/features/documentos/ActasTab";
import { OrdenesTab } from "@/features/documentos/OrdenesTab";
import { ActasAprobadas } from "@/features/secretaria/ActasAprobadas";

export function DocumentosPage() {
  const [tab, setTab] = React.useState("emitidos");
  const { data: perfil } = usePerfil();
  const esOficial = perfil?.es_oficial ?? false;

  return (
    <div>
      <PageHeader
        titulo="Documentos"
        descripcion="Hoja de vida, actas de reunión y órdenes de capitanía con folio y verificación."
      />
      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { id: "emitidos", etiqueta: "Emitidos", contenido: <EmitidosTab /> },
          { id: "actas", etiqueta: esOficial ? "Actas" : "Actas aprobadas", contenido: esOficial ? <ActasTab /> : <ActasAprobadas /> },
          { id: "ordenes", etiqueta: "Órdenes de capitanía", contenido: <OrdenesTab /> },
        ]}
      />
    </div>
  );
}
