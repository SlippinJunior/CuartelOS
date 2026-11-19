/** Tipos de negocio usados por la interfaz. Espejo de las tablas del esquema. */

export type Rango = "aspirante" | "bombero" | "honorario" | "insigne" | "martir";
export type EstadoPersona =
  | "activo" | "suspendido" | "renunciado" | "separado" | "expulsado" | "fallecido" | "trasladado";
export type Marca = "A" | "F" | "P" | "R" | "S" | "L";
export type EstadoLista = "borrador" | "cerrada" | "enviada" | "anulada";

export interface Persona {
  id: string;
  compania_id: number;
  registro: number;
  rut: string | null;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_ingreso: string | null;
  rango: Rango;
  estado: EstadoPersona;
  fecha_estado: string | null;
  observaciones: string | null;
  codigo_charlie?: string | null;
  anios_servicio_manual?: number | null;
  exento_guardia?: boolean;
  motivo_exencion?: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface PersonaEvento {
  id: number;
  persona_id: string;
  tipo: string;
  rango: Rango | null;
  estado: EstadoPersona | null;
  fecha: string;
  motivo: string | null;
  creado_en: string;
}

export interface Cargo {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  es_unico: boolean;
  orden: number;
}

export interface CargoPeriodo {
  id: number;
  persona_id: string;
  cargo_id: number;
  desde: string;
  hasta: string | null;
  acta_id: number | null;
  observacion: string | null;
  cargo?: Cargo;
}

export interface Curso {
  id: number;
  nombre: string;
  institucion: string;
  nivel: string | null;
  horas: number | null;
}

export interface PersonaCurso {
  id: number;
  persona_id: string;
  curso_id: number;
  fecha_aprobacion: string | null;
  vigente_hasta: string | null;
  nota: number | null;
  observacion: string | null;
  curso?: Curso;
}

export interface PremioTipo {
  id: number;
  codigo: string;
  nombre: string;
  requiere_anios: boolean;
}

export interface PersonaPremio {
  id: number;
  persona_id: string;
  premio_tipo_id: number;
  anios: number | null;
  otorgado_por: string | null;
  fecha: string | null;
  observacion: string | null;
  premio_tipo?: PremioTipo;
}

export interface SituacionEspecial {
  id: number;
  persona_id: string;
  tipo: string;
  desde: string;
  hasta: string | null;
  motivo: string | null;
}

export interface LicenciaConducir {
  id: number;
  persona_id: string;
  clase: string;
  numero: string | null;
  vence: string | null;
  notas: string | null;
}

export interface DatoSensible {
  persona_id: string;
  grupo_sanguineo: string | null;
  alergias: string | null;
  condiciones: string | null;
  medicamentos: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  notas: string | null;
}

export interface TipoActo {
  clave: string;
  descripcion: string;
  obligatorio: boolean;
  cuenta_para_premio: boolean;
  activo: boolean;
}

export interface Lista {
  id: number;
  compania_id: number;
  anio: number;
  numero: number;
  fecha: string;
  tipo_acto_clave: string | null;
  descripcion: string | null;
  direccion: string | null;
  estado: EstadoLista;
  es_abono: boolean;
  abono_justificacion: string | null;
  origen: string;
  cerrada_en: string | null;
  enviada_en: string | null;
  creado_en?: string;
  actualizado_en?: string;
  tipo_acto?: TipoActo;
}

export interface Asistencia {
  lista_id: number;
  persona_id: string;
  marca: Marca;
  observacion: string | null;
  registrado_por: string | null;
  registrado_en: string;
  actualizado_en: string;
}

export interface AsistenciaPersona {
  persona_id: string;
  registro: number;
  nombre: string;
  anio: number;
  asistencias: number;
  faltas: number;
  permisos: number;
  eximidos: number;
  suspensiones: number;
  pct: number | null;
}

export interface Unidad {
  id: number;
  codigo: string;
  tipo_unidad_id: number | null;
  patente: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  km_actual: number | null;
  estado: string;
  tipo_unidad?: { nombre: string; codigo: string } | null;
}

export interface UnidadVista {
  id: number;
  unidad_id: number;
  lado: string;
  imagen_archivo_id: string | null;
  orden: number;
}

export interface Ubicacion {
  id: number;
  unidad_id: number | null;
  padre_id: number | null;
  vista_id: number | null;
  tipo: string;
  codigo: string;
  nombre: string;
  forma: number[][] | null;
  orden: number;
}

export interface Articulo {
  id: number;
  nombre: string;
  categoria_id: number | null;
  vida_util_meses: number | null;
  requiere_serie: boolean;
  unidad_medida: string;
}

export interface ItemInventario {
  id: number;
  articulo_id: number;
  ubicacion_id: number | null;
  marca: string | null;
  n_serie: string | null;
  cantidad: number;
  estado: string;
  origen: string;
  valor: number | null;
  observacion: string | null;
  articulo?: Articulo;
  ubicacion?: Ubicacion;
}

export interface Asignacion {
  id: number;
  persona_id: string;
  articulo_id: number;
  item_id: number | null;
  cantidad: number;
  talla: string | null;
  fecha_entrega: string | null;
  fecha_devolucion: string | null;
  origen: string;
  observacion: string | null;
  articulo?: Articulo;
}

export interface Movimiento {
  id: number;
  fecha: string;
  tipo: "ingreso" | "egreso";
  cuenta_id: number;
  fondo_id: number | null;
  categoria_id: number | null;
  compromiso_id: number | null;
  monto: number;
  glosa: string;
  contraparte_id: number | null;
  n_documento: string | null;
  medio_pago: string;
  tiene_comprobante: boolean;
  anulado: boolean;
  motivo_anulacion: string | null;
  categoria?: { nombre: string; codigo: string } | null;
  fondo?: { nombre: string } | null;
}

export interface CuotaPago {
  id: number;
  persona_id: string;
  periodo: string;
  monto: number;
  movimiento_id: number | null;
  exento: boolean;
  condonada: boolean;
  observacion: string | null;
}

export interface CuotaValor {
  id: number;
  anio: number;
  monto: number;
  vigente_desde: string;
  vigente_hasta: string | null;
}

export interface CampanaParticipacion {
  campana_id: number;
  persona_id: string;
  venta_total: number;
  aporte_obligatorio: number;
  aporte_adicional: number;
  saldo_arrastre: number;
  observacion: string | null;
}

export interface CartolaFila extends Movimiento {
  saldo: number;
}

export interface PresupuestoEjecucion {
  anio: number;
  version: number;
  categoria_id: number;
  categoria_codigo: string;
  categoria: string;
  tipo: "ingreso" | "egreso";
  linea_id: number;
  item: string | null;
  monto_anual: number;
  ejecutado: number;
  pct: number | null;
}

export interface ProyeccionFila {
  mes: string;
  saldo_inicial: number;
  ingresos: number;
  egresos: number;
  compromisos: number;
  saldo_proyectado: number;
}

export interface Alerta {
  id: number;
  regla: string;
  entidad: string;
  entidad_id: string;
  detalle: string;
  severidad: number;
  estado: string;
  detectada_en: string;
}

export interface ConsumidorConsentimiento {
  version: number;
  titulo: string;
  texto: string;
  aceptado: boolean;
}

export interface Perfil {
  usuario_id: string;
  email: string | null;
  activo: boolean;
  persona: {
    id: string;
    registro: number;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    nombre: string;
    rango: Rango;
    estado: EstadoPersona;
    email: string | null;
  } | null;
  roles: string[];
  es_oficial: boolean;
  es_admin: boolean;
  compania: { id: number; nombre: string; cuerpo: string; lema: string | null } | null;
  consentimiento: ConsumidorConsentimiento | null;
}

export interface PanelInicio {
  alertas: Alerta[];
  guardia?: CumplimientoGuardia | null;
  notificaciones_guardia?: Array<{
    id: number;
    tipo: string;
    turno_id: number | null;
    mensaje: string | null;
    creado_en: string;
  }>;
  reportes_por_firmar?: Array<{
    turno_id: number;
    fecha: string;
    detalle: string;
  }>;
  tareas: Array<{
    tipo: string;
    id: number;
    titulo: string;
    vence: string | null;
    ruta: string;
  }>;
  compromisos_pendientes: number;
  es_oficial: boolean;
  roles: string[];
}

export interface DocumentoEmitido {
  id: string;
  tipo_documento_codigo: string;
  anio: number;
  folio: number;
  persona_id: string | null;
  referencia: string | null;
  hash_sha256: string;
  token_verificacion: string;
  emitido_por: string | null;
  emitido_en: string;
  anulado: boolean;
  motivo_anulacion: string | null;
  tipo_documento?: { nombre: string; codigo: string };
}

export interface HojaVida {
  persona_id: string;
  datos: Record<string, any>;
}

export interface UsuarioAdmin {
  user_id: string;
  email: string | null;
  persona_id: string | null;
  nombre: string | null;
  registro: number | null;
  activo: boolean;
  roles: string[];
}

export interface Contraparte {
  id: number;
  tipo: string;
  nombre: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
}

export interface Acta {
  id: number;
  tipo_sesion_codigo: string;
  numero: number;
  anio: number;
  fecha: string;
  aprobada_en_acta_id: number | null;
  observacion?: string | null;
}

export interface Parametro {
  clave: string;
  valor: unknown;
  descripcion: string | null;
  grupo: string;
}

export type EstadoCuota = "pagada" | "pendiente" | "exento" | "no_aplica" | "futura" | "condonada";

export interface CuotaEstado {
  persona_id: string;
  registro: number;
  nombre: string;
  rango: Rango;
  periodo: string;
  estado: EstadoCuota;
  monto: number | null;
  monto_esperado: number;
  cuota_id: number | null;
  movimiento_id: number | null;
  motivo_anulacion: string | null;
}

export interface CartolaDetalle {
  id: number;
  cuenta_id: number;
  fecha: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  glosa: string;
  anulado: boolean;
  motivo_anulacion: string | null;
  medio_pago: string;
  n_documento: string | null;
  categoria: string | null;
  fondo: string | null;
  saldo: number;
}

export interface OrdenCapitania {
  id: number;
  numero: number;
  anio: number;
  fecha: string;
  materia: string | null;
  texto: string | null;
  archivo_id: string | null;
  creado_por: string | null;
  creado_en: string;
  enviada_en: string | null;
  correo_estado: string | null;
  correo_destinatarios: number | null;
}

export interface ActaListado {
  id: number;
  tipo_sesion_codigo: string;
  numero: number;
  anio: number;
  fecha: string;
  lista_id: number | null;
  quorum_ok: boolean | null;
  aprobada_en_acta_id: number | null;
  archivo_id: string | null;
  texto: string | null;
  tipo_sesion?: { nombre: string } | null;
}

export interface Acuerdo {
  id: number;
  acta_id: number;
  numero: number;
  texto: string;
  monto: number | null;
  plazo: string | null;
  estado: string;
  resultado: string | null;
  seguimiento?: string | null;
}

// ---------------------------------------------------------------------------
// Antigüedad y guardias
// ---------------------------------------------------------------------------

export type CategoriaGuardia = "0_4" | "5_9" | "10_19" | "20_34" | "exento";
export type OrigenAntiguedad = "manual" | "calculado";

export interface AntiguedadPersona {
  persona_id: string;
  registro: number;
  nombre: string;
  codigo_charlie: string | null;
  anios_premios: number;
  anios_abonos: number;
  anios_calculados: number;
  anios_servicio_manual: number | null;
  anios_servicio: number;
  origen_antiguedad: OrigenAntiguedad;
  edad: number | null;
  exento_guardia: boolean;
  exento_efectivo: boolean;
  motivo_exencion: string | null;
  categoria_guardia: CategoriaGuardia;
  fecha_ingreso: string | null;
  estado: EstadoPersona;
}

export type EstadoCiclo = "planificado" | "abierto" | "en_curso" | "cerrado";
export type EstadoTurnoGuardia = "programada" | "constituida" | "firmada";
export type CharlieModalidad = "Z8" | "Z20" | "sin_maquinista";
export type OrigenIntegrante =
  | "inscripcion" | "asignacion_capitania" | "reemplazo" | "llegada_tardia" | "charlie_z8" | "autoasignacion";
export type EstadoIntegrante = "inscrito" | "reemplazado" | "cumplida" | "ausente";

export interface CierreSemana {
  vence: string;
  cerrada: boolean;
  vence_hoy: boolean;
  dias_para_cierre: number;
}

export interface GuardiaCiclo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  cupo_base: number;
  estado: EstadoCiclo;
  notificado_s1_en: string | null;
  notificado_s2_en: string | null;
}

export interface GuardiaIntegranteGrilla {
  persona_id: string;
  registro: number;
  nombre: string;
  codigo_charlie: string | null;
  origen: OrigenIntegrante;
  estado: EstadoIntegrante;
  hora_llegada: string | null;
  reemplaza_a_persona_id: string | null;
  reemplazo_nota: string | null;
  es_jefe: boolean;
}

export interface GuardiaTurnoGrilla {
  turno_id: number;
  fecha: string;
  semana_num: 1 | 2;
  estado: EstadoTurnoGuardia;
  inicio: string;
  termino: string | null;
  feriado: string | null;
  hora_aviso_central: string | null;
  charlie_modalidad: CharlieModalidad | null;
  charlie_codigo: string | null;
  observacion: string | null;
  jefe_persona_id: string | null;
  firmado_en: string | null;
  guardianes: number;
  integrantes: GuardiaIntegranteGrilla[];
}

export interface GrillaGuardia {
  ciclo: GuardiaCiclo;
  semana_1_cubierta: boolean;
  semana_2_cubierta: boolean;
  dias: GuardiaTurnoGrilla[];
}

export interface CumplimientoGuardia {
  vinculado: boolean;
  persona_id?: string;
  anios_servicio?: number;
  origen_antiguedad?: OrigenAntiguedad;
  categoria_guardia?: CategoriaGuardia;
  exento?: boolean;
  motivo_exencion?: string | null;
  ciclo_id?: number | null;
  ciclo_inicio?: string | null;
  ciclo_fin?: string | null;
  cumplidas?: number;
  inscritas?: number;
  requiere_guardia?: boolean;
  pendiente?: boolean;
  notificaciones_sin_leer?: number;
}

export interface NotificacionGuardia {
  id: number;
  tipo: string;
  turno_id: number | null;
  mensaje: string | null;
  creado_en: string;
  leida_en: string | null;
}

export interface PersonaGuardiaCatalogo {
  id: string;
  registro: number;
  nombre: string;
  codigo_charlie: string | null;
  anios_servicio: number;
  categoria_guardia: CategoriaGuardia;
  exento: boolean;
}

export interface EstadisticasGuardia {
  periodo: { desde: string; hasta: string };
  por_categoria: Array<{
    categoria: CategoriaGuardia;
    personas: number;
    cumplidas: number;
    llegadas_tardias: number;
  }>;
  por_dia_semana: Array<{ dia: number; guardianes: number }>;
  maquinistas: Array<{ persona_id: string; codigo: string; z8: number; z20: number }>;
}

export interface GuardiaSituacion {
  id: number;
  persona_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  respuesta: string | null;
  creado_en: string;
}
