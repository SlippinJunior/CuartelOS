import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/tabs";
import { EmitidosTab } from "@/features/documentos/EmitidosTab";
import { ActasTab } from "@/features/documentos/ActasTab";
import { OrdenesTab } from "@/features/documentos/OrdenesTab";

export function DocumentosPage() {
  const [tab, setTab] = React.useState("emitidos");

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
          { id: "actas", etiqueta: "Actas", contenido: <ActasTab /> },
          { id: "ordenes", etiqueta: "Órdenes de capitanía", contenido: <OrdenesTab /> },
        ]}
      />
    </div>
  );
}
