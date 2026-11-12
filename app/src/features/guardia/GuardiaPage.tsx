import { Proximamente } from "@/components/common/Proximamente";

export function GuardiaPage() {
  return (
    <Proximamente
      titulo="Guardia"
      descripcion="Turnos, órdenes de capitanía y accidentes en acto de servicio."
      alcance={[
        "Rol de guardia nocturna e integrantes (P7).",
        "Órdenes de capitanía con su documento adjunto.",
        "Registro de accidentes dentro de 24 horas (P6) y certificado de concurrencia (P5).",
        "Calendario de guardias por unidad y jefe de turno.",
      ]}
      documento="guardia.md"
    />
  );
}
