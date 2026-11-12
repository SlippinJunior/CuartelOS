/** Normalización para búsquedas locales (misma lógica que nucleo.normalizar). */
export function nucleoNormalizar(texto: string | null | undefined): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
