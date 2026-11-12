import { Proximamente } from "@/components/common/Proximamente";

export function SecretariaPage() {
  return (
    <Proximamente
      titulo="Secretaría"
      descripcion="Actas, acuerdos, correspondencia, elecciones y traspasos de cargo."
      alcance={[
        "Libro de actas con quórum derivado de la lista de asistencia.",
        "Acuerdos con seguimiento y vínculo al compromiso de tesorería.",
        "Correspondencia recibida y despachada con contrapartes.",
        "Padrón electoral (P15), traspaso de cargo (P17), memoria y carpeta anual.",
      ]}
      documento="secretaria.md"
    />
  );
}
