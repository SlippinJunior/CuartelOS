# Visión

## El problema
La compañía gestiona personas, asistencia, guardias, material, tesorería,
actas y disciplina en planillas y libros. Los datos no se cruzan: un acuerdo con
monto no llega a tesorería, un bombero con EPP a cargo puede tener 0% de
asistencia, una unidad puede circular con la revisión técnica vencida y nadie
se entera. El documento *ERP Segunda Compañía CBL* define 8 módulos y 23 puntos
de impresión para cerrar esas brechas.

## La propuesta
Una instancia por compañía, usable desde el celular, con una base normalizada y
reglas en el servidor. La filosofía es:

1. **El dato se escribe una vez.** El pase de lista alimenta la asistencia, la
   hoja de vida, los premios y las alertas.
2. **La base impone las reglas.** Lista cerrada, período cerrado, folio
   correlativo, cargos incompatibles. La interfaz no es la autoridad.
3. **Lo sensible se separa.** Salud y contacto de emergencia viven en otra
   tabla, con lectura auditada. Disciplina vive en otro esquema, visible solo
   para el Consejo.
4. **Lo que no está claro no se inventa.** Va a staging para revisión humana.
5. **El celular primero.** Botones grandes, barra inferior, pase de lista
   offline y PDF verificable por QR.

## Alcance de la Etapa 1
- Fundación completa (base, seguridad, navegación, diseño, documentos).
- Personal / Hoja de vida y Asistencia funcionales.
- Esqueletos con mock para Guardia, Material 2D, Tesorería y Secretaría.
- Importación del legado y seed ficticio.
- Modelo dimensional y VIPER solo documentados.

## Fuera de alcance por ahora
- Compilación Typst en producción (hay respaldo con `pdf-lib`).
- Inventario gráfico editable (Etapa 3).
- Conciliación bancaria automática (Etapa 2).
- Integración directa con VIPER (requiere API del Cuerpo).

## Relacionado con
`docs/hoja-de-ruta.md`, `plan_implementacion.md`.
