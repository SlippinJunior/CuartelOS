import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/tabs";
import { usePerfil } from "@/features/auth/sesion";
import { puedeGestionarGuardias } from "@/lib/permisos";
import { GrillaGuardia } from "@/features/guardia/GrillaGuardia";
import { EstadisticasGuardiaPanel } from "@/features/guardia/EstadisticasGuardia";
import { GestionGuardia } from "@/features/guardia/GestionGuardia";
import { MisGuardias } from "@/features/guardia/MisGuardias";

export function GuardiaPage() {
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const gestiona = puedeGestionarGuardias(roles);
  const esOficial = perfil?.es_oficial ?? false;

  const items = [
    { id: "grilla", etiqueta: "Grilla", contenido: <GrillaGuardia gestiona={gestiona} /> },
    { id: "mias", etiqueta: "Mis guardias", contenido: <MisGuardias /> },
    ...(esOficial
      ? [{ id: "estadisticas", etiqueta: "Estadísticas", contenido: <EstadisticasGuardiaPanel /> }]
      : []),
    ...(gestiona
      ? [{ id: "gestion", etiqueta: "Gestión", contenido: <GestionGuardia /> }]
      : []),
  ];

  return (
    <div>
      <PageHeader
        titulo="Guardia"
        descripcion="Turnos nocturnos por ciclo, inscripción, reporte y firma digital."
      />
      <Tabs items={items} />
    </div>
  );
}
