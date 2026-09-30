// ====== Tipos base ======

export type EstadoMuestraLaboratorio =
  | 'PENDIENTE'
  | 'RECOLECTADA'
  | 'RECEPCIONADA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'ANULADA';

export type EstadoPrevioAnulacionMuestra =
  | 'PENDIENTE'
  | 'RECOLECTADA'
  | 'RECEPCIONADA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | null;

export type ModalidadInstanciasMuestra =
  | 'UNICA'
  | 'MUESTRAS_INDEPENDIENTES'
  | 'REPETICIONES_MISMA_MUESTRA';

export type AlcanceMuestra = 'TODA_PRUEBA' | 'ITEMS_ESPECIFICOS';

export type UnidadVolumenMuestra = 'uL' | 'mL' | 'L';

export type EtapaEvidenciaMuestra =
  | 'RECOLECCION'
  | 'RECEPCION'
  | 'ACEPTACION'
  | 'RECHAZO';

export type EstadoEvidenciaMuestra = 'ACTIVA' | 'ANULADA';

export type EstadoMaestroSnapshot = 'ACTIVO' | 'INACTIVO';

// ====== Snapshot tipo de muestra ======

export interface ITipoMuestraSnapshot {
  codTipoMuestra: string | null;
  nombreTipoMuestra: string;
  descripcionTipoMuestra: string;
  estadoTipoMuestra: EstadoMaestroSnapshot;
}

// ====== Snapshot tubo o envase ======

export interface ITuboEnvaseSnapshot {
  codTuboEnvase: string | null;
  nombreTuboEnvase: string;
  descripcionTuboEnvase: string;

  color: string;
  aditivo: string;

  capacidad: number | null;
  unidadCapacidad: string | null;

  estadoTuboEnvase: EstadoMaestroSnapshot;
}

// ====== Opción histórica permitida ======

export interface IOpcionMuestraSnapshot {
  tipoMuestraId: string;
  tipoMuestra: ITipoMuestraSnapshot;

  tuboEnvaseId: string;
  tuboEnvase: ITuboEnvaseSnapshot;
}

// ====== Cobertura clínica ======

export interface ICoberturaMuestraLaboratorio {
  claveCobertura: string;
  claveUnidad: string;

  servicioId: string;
  codServicio: string;
  nombreServicio: string;

  pruebaLabId: string;
  codPruebaLab: string;
  nombrePruebaLab: string;

  modalidadInstancias: ModalidadInstanciasMuestra;

  numeroInstancia: number;
  etiquetaInstancia: string | null;

  indiceRequerimiento: number;
  descripcionRequerimiento: string;

  alcance: AlcanceMuestra;

  opcionesPermitidas: IOpcionMuestraSnapshot[];

  itemsAsociados: string[];

  cantidadRecipientes: number;

  volumenMinimo: number | null;
  unidadVolumen: UnidadVolumenMuestra | null;

  permiteCompartirMuestra: boolean;

  observacion: string;
}

// ====== Evidencia fotográfica ======

export interface IEvidenciaFotograficaMuestra {
  _id: string;

  archivoId: string;

  nombreArchivo: string;

  mimeType: string;

  tamanoBytes: number | null;

  etapa: EtapaEvidenciaMuestra;

  observacion: string;

  estadoEvidencia: EstadoEvidenciaMuestra;

  registradoPor: string;

  usuarioRegistro: string | null;

  fechaRegistro: Date | string | null;

  anuladaPor: string | null;

  usuarioAnulacion: string | null;

  fechaAnulacion: Date | string | null;

  motivoAnulacion: string | null;

  urlTemporal?: string | null;
}

// ====== Muestra de laboratorio ======

export interface IMuestraLaboratorio {
  _id: string;

  solicitudAtencionId: string;

  codSolicitud: string;

  codigoLaboratorio: string | null;

  codMuestra: string;

  codigoEtiqueta: string | null;

  claveMuestraPlan: string;

  numeroRecipiente: number;

  numeroIntento: number;

  muestraAnteriorId: string | null;

  coberturas: ICoberturaMuestraLaboratorio[];

  // ====== Opción física utilizada ======

  tipoMuestraId: string | null;

  tipoMuestra: ITipoMuestraSnapshot | null;

  tuboEnvaseId: string | null;

  tuboEnvase: ITuboEnvaseSnapshot | null;

  volumenRecolectado: number | null;

  unidadVolumenRecolectado: UnidadVolumenMuestra | null;

  // ====== Estado ======

  estadoMuestra: EstadoMuestraLaboratorio;

  observacionGeneral: string;

  // ====== Recolección ======

  recolectadoPor: string | null;

  usuarioRecoleccion: string | null;

  fechaRecoleccion: Date | string | null;

  observacionRecoleccion: string;

  // ====== Recepción ======

  recibidoPor: string | null;

  usuarioRecepcion: string | null;

  fechaRecepcion: Date | string | null;

  observacionRecepcion: string;

  // ====== Aceptación ======

  aceptadoPor: string | null;

  usuarioAceptacion: string | null;

  fechaAceptacion: Date | string | null;

  observacionAceptacion: string;

  // ====== Rechazo ======

  rechazadoPor: string | null;

  usuarioRechazo: string | null;

  fechaRechazo: Date | string | null;

  motivoRechazo: string | null;

  // ====== Anulación ======

  estadoPrevioAnulacion: EstadoPrevioAnulacionMuestra;

  anuladoPor: string | null;

  usuarioAnulacion: string | null;

  fechaAnulacion: Date | string | null;

  motivoAnulacion: string | null;

  // ====== Evidencias ======

  evidenciasFotograficas: IEvidenciaFotograficaMuestra[];

  // ====== Auditoría ======

  createdBy: string;

  usuarioRegistro: string | null;

  fechaRegistro: Date | string | null;

  updatedBy: string | null;

  usuarioActualizacion: string | null;

  fechaActualizacion: Date | string | null;

  createdAt?: Date | string;

  updatedAt?: Date | string;

  // ====== Campo calculado de consulta ======

  esVigente?: boolean;
}

// ====== Paciente resumido ======

export interface IPacienteSolicitudMuestra {
  hc: string | null;

  clienteId: string | null;

  tipoDoc: string | null;

  nroDoc: string | null;

  nombreCliente: string;

  apePatCliente: string;

  apeMatCliente: string;

  sexoPaciente: string | null;

  fechaNacimientoPaciente: Date | string | null;
}

// ====== Solicitud resumida ======

export interface ISolicitudMuestraLaboratorio {
  _id: string;

  codSolicitud: string;

  codigoLaboratorio: string | null;

  tipo: string;

  estado: string;

  fechaEmision: Date | string | null;

  paciente: IPacienteSolicitudMuestra;
}

// ====== Conteo de estados ======

export interface IConteoEstadosMuestra {
  total: number;

  pendientes: number;

  recolectadas: number;

  recepcionadas: number;

  aceptadas: number;

  rechazadas: number;

  anuladas: number;
}

// ====== Resumen operativo ======

export interface IResumenMuestrasLaboratorio {
  totalDocumentos: number;

  recipientesPlanificados: number;

  documentos: IConteoEstadosMuestra;

  vigentes: IConteoEstadosMuestra;
}

// ====== Intento vigente resumido ======

export interface IIntentoVigenteMuestra {
  _id: string;

  codMuestra: string;

  codigoEtiqueta: string | null;

  numeroIntento: number;

  estadoMuestra: EstadoMuestraLaboratorio;
}

// ====== Plan de muestra ======

export interface IPlanMuestraLaboratorio {
  claveMuestraPlan: string;

  numeroRecipiente: number | null;

  totalIntentos: number;

  intentoVigente: IIntentoVigenteMuestra | null;

  requiereReintento: boolean;

  intentos: IMuestraLaboratorio[];
}

// ====== Consulta por solicitud o código ======

export interface IConsultaMuestrasLaboratorioResponse {
  ok: boolean;

  msg: string;

  solicitud: ISolicitudMuestraLaboratorio;

  resumen: IResumenMuestrasLaboratorio;

  planes: IPlanMuestraLaboratorio[];
}

// ====== Intento de cadena ======

export interface IIntentoCadenaMuestra {
  _id: string;

  codMuestra: string;

  codigoEtiqueta: string | null;

  numeroRecipiente: number;

  numeroIntento: number;

  muestraAnteriorId: string | null;

  estadoMuestra: EstadoMuestraLaboratorio;

  motivoRechazo: string | null;

  fechaRecoleccion: Date | string | null;

  fechaRecepcion: Date | string | null;

  fechaAceptacion: Date | string | null;

  fechaRechazo: Date | string | null;

  estadoPrevioAnulacion: EstadoPrevioAnulacionMuestra;

  anuladoPor: string | null;

  usuarioAnulacion: string | null;

  fechaAnulacion: Date | string | null;

  motivoAnulacion: string | null;

  esActual: boolean;

  esVigente: boolean;
}

// ====== Cadena de intentos ======

export interface ICadenaIntentosMuestra {
  totalIntentos: number;

  intentoVigenteId: string | null;

  numeroIntentoVigente: number | null;

  intentoAnteriorId: string | null;

  intentoSiguienteId: string | null;

  intentos: IIntentoCadenaMuestra[];
}

// ====== Detalle de muestra ======

export interface IDetalleMuestraLaboratorioResponse {
  ok: boolean;

  msg: string;

  solicitud: ISolicitudMuestraLaboratorio;

  muestra: IMuestraLaboratorio;

  cadena: ICadenaIntentosMuestra;
}

// ====== Inicialización ======

export interface IResumenInicializacionMuestras {
  unidadesLaboratorio: number;

  unidadesConMuestra: number;

  requerimientosMuestra: number;

  recipientesRequeridos: number;

  planesMuestra: number;

  muestrasCreadas: number;

  muestrasExistentes: number;

  totalMuestras: number;
}

export interface IInicializarMuestrasResponse {
  ok: boolean;

  msg: string;

  resumen: IResumenInicializacionMuestras;

  muestras: IMuestraLaboratorio[];
}

// ====== DTO recolección ======

export interface IRecolectarMuestraDTO {
  tipoMuestraId: string;

  tuboEnvaseId: string;

  volumenRecolectado?: number | null;

  unidadVolumenRecolectado?: UnidadVolumenMuestra | null;

  observacionRecoleccion?: string;
}

// ====== DTO recepción ======

export interface IRecibirMuestraDTO {
  observacionRecepcion?: string;
}

// ====== DTO aceptación ======

export interface IAceptarMuestraDTO {
  observacionAceptacion?: string;
}

// ====== DTO rechazo ======

export interface IRechazarMuestraDTO {
  motivoRechazo: string;
}

// ====== DTO anulación ======

export interface IAnularMuestraDTO {
  motivoAnulacion: string;
}

// ====== Respuesta acción de muestra ======

export interface IAccionMuestraResponse {
  ok: boolean;

  msg: string;

  estadoMuestra: EstadoMuestraLaboratorio;

  muestra: IMuestraLaboratorio;
}

// ====== Respuesta rechazo ======

export interface IRechazarMuestraResponse extends IAccionMuestraResponse {
  requiereNuevaMuestra: boolean;
}

// ====== Respuesta anulación ======

export interface IAnularMuestraResponse extends IAccionMuestraResponse {
  estadoAnterior: EstadoMuestraLaboratorio;

  generaReintentoAutomatico: boolean;
}

// ====== Respuesta reintento ======

export interface IReintentoMuestraAnterior {
  _id: string;

  codigoEtiqueta: string | null;

  numeroIntento: number;

  estadoMuestra: EstadoMuestraLaboratorio;

  motivoRechazo?: string | null;
}

export interface IReintentarMuestraResponse {
  ok: boolean;

  msg: string;

  creada: boolean;

  muestraAnterior: IReintentoMuestraAnterior;

  muestra: IMuestraLaboratorio;
}

// ====== Resumen de evidencias ======

export interface IResumenEvidenciasMuestra {
  total: number;

  activas: number;

  anuladas: number;
}

// ====== Muestra resumida para evidencias ======

export interface IMuestraResumenEvidencias {
  _id: string;

  solicitudAtencionId: string;

  codSolicitud: string;

  codigoLaboratorio: string | null;

  codMuestra: string;

  codigoEtiqueta: string | null;

  numeroRecipiente: number;

  numeroIntento: number;

  estadoMuestra: EstadoMuestraLaboratorio;
}

// ====== Consulta de evidencias ======

export interface IEvidenciasMuestraResponse {
  ok: boolean;

  msg: string;

  muestra: IMuestraResumenEvidencias;

  resumenEvidencias: IResumenEvidenciasMuestra;

  incluirAnuladas: boolean;

  totalEvidencias: number;

  expiraEnSegundos: number;

  evidencias: IEvidenciaFotograficaMuestra[];
}

// ====== Respuesta registro de evidencia ======

export interface IRegistrarEvidenciaMuestraResponse {
  ok: boolean;

  msg: string;

  muestraLaboratorioId: string;

  codigoEtiqueta: string | null;

  evidencia: IEvidenciaFotograficaMuestra;
}

// ====== DTO anulación de evidencia ======

export interface IAnularEvidenciaMuestraDTO {
  motivoAnulacion: string;
}

// ====== Evidencia anulada resumida ======

export interface IEvidenciaAnuladaMuestra {
  _id: string;

  archivoId: string;

  nombreArchivo: string;

  etapa: EtapaEvidenciaMuestra;

  estadoEvidencia: 'ANULADA';

  anuladaPor: string | null;

  usuarioAnulacion: string | null;

  fechaAnulacion: Date | string | null;

  motivoAnulacion: string | null;
}

// ====== Respuesta anulación de evidencia ======

export interface IAnularEvidenciaMuestraResponse {
  ok: boolean;

  msg: string;

  muestraLaboratorioId: string;

  codigoEtiqueta: string | null;

  evidencia: IEvidenciaAnuladaMuestra;
}

// ====== Origen de atención bandeja ======

export type OrigenAtencionBandejaMuestra = 'PARTICULAR' | 'EMPRESA';

// ====== Médico de servicio ======

export interface IMedicoAtiendeBandejaMuestra {
  medicoId: string | null;

  codRecHumano?: string | null;

  nombreRecHumano?: string | null;

  apePatRecHumano?: string | null;

  apeMatRecHumano?: string | null;

  nroColegiatura?: string | null;

  rne?: string | null;
}

// ====== Servicio de solicitud ======

export interface IServicioBandejaMuestra {
  servicioId: string | null;

  codServicio: string;

  nombreServicio: string;

  estado: string;

  medicoAtiende: IMedicoAtiendeBandejaMuestra | null;
}

// ====== Datos particulares ======

export interface IParticularBandejaMuestra {
  cotizacionId: string | null;

  codCotizacion: string | null;

  pagoId: string | null;

  codPago: string | null;
}

// ====== Datos empresa ======

export interface IEmpresaBandejaMuestra {
  programacionEmpresaId: string | null;

  codProgramacion: string | null;

  empresaId: string | null;

  rucEmpresa: string | null;

  razonSocialEmpresa: string;

  protocoloId: string | null;

  codProtocolo: string | null;

  nombreProtocolo: string | null;

  sede: string | null;

  tipoEvaluacion: string | null;

  tipoAtencion: string | null;

  prioridad: string | null;

  estadoProgramacion: string | null;
}

// ====== Solicitud de bandeja ======

export interface ISolicitudBandejaMuestra {
  _id: string;

  codSolicitud: string;

  codigoLaboratorio: string | null;

  origenAtencion: OrigenAtencionBandejaMuestra;

  tipo: string;

  estado: string;

  fechaEmision: Date | string | null;

  paciente: IPacienteSolicitudMuestra;

  particular: IParticularBandejaMuestra | null;

  empresa: IEmpresaBandejaMuestra | null;

  servicios: IServicioBandejaMuestra[];
}

// ====== Tipo de grupo de recipiente ======

export type TipoGrupoRecipientePlanToma = 'DEFINIDO' | 'ALTERNATIVO';

// ====== Tipo de muestra para plan de toma ======

export interface ITipoMuestraPlanToma {
  codTipoMuestra: string | null;

  nombreTipoMuestra: string;

  descripcionTipoMuestra: string;
}

// ====== Tubo o envase para plan de toma ======

export interface ITuboEnvasePlanToma {
  codTuboEnvase: string | null;

  nombreTuboEnvase: string;

  descripcionTuboEnvase: string;

  color: string;

  aditivo: string;

  capacidad: number | null;

  unidadCapacidad: string | null;
}

// ====== Opción física del plan ======

export interface IOpcionPlanToma {
  tipoMuestraId: string;

  tipoMuestra: ITipoMuestraPlanToma;

  tuboEnvaseId: string;

  tuboEnvase: ITuboEnvasePlanToma;
}

// ====== Examen asociado a recipiente ======

export interface IExamenRecipientePlanToma {
  claveUnidad: string | null;

  servicioId: string | null;

  codServicio: string;

  nombreServicio: string;

  pruebaLabId: string | null;

  codPruebaLab: string;

  nombrePruebaLab: string;

  numeroInstancia: number;

  etiquetaInstancia: string | null;
}

// ====== Recipiente del plan ======

export interface IRecipientePlanToma {
  examenes: IExamenRecipientePlanToma[];
}

// ====== Grupo de recipientes ======

export interface IGrupoRecipientePlanToma {
  tipo: TipoGrupoRecipientePlanToma;

  cantidad: number;

  opciones: IOpcionPlanToma[];

  recipientes: IRecipientePlanToma[];
}

// ====== Plan resumido de toma ======

export interface IPlanTomaBandejaMuestra {
  disponible: boolean;

  requiereMuestra: boolean;

  totalRecipientes: number;

  gruposRecipientes: IGrupoRecipientePlanToma[];

  mensaje: string | null;
}

// ====== Estado de muestras en bandeja ======

export interface IMuestrasBandejaSolicitud {
  requiereMuestra: boolean;

  inicializadas: boolean;

  puedeInicializar: boolean;

  planToma: IPlanTomaBandejaMuestra;

  resumen: IResumenMuestrasLaboratorio;
}
// ====== Fila de bandeja ======

export interface IBandejaTomaMuestrasItem {
  solicitud: ISolicitudBandejaMuestra;

  muestras: IMuestrasBandejaSolicitud;
}

// ====== Resumen de bandeja ======

export interface IResumenBandejaTomaMuestras {
  totalSolicitudes: number;

  particulares: number;

  empresas: number;

  solicitudesAnuladas: number;

  conMuestrasInicializadas: number;

  sinMuestrasInicializadas: number;

  pendientesInicializacion: number;
}

// ====== Respuesta bandeja ======

export interface IBandejaTomaMuestrasResponse {
  ok: boolean;

  msg: string;

  resumen: IResumenBandejaTomaMuestras;

  solicitudes: IBandejaTomaMuestrasItem[];
}
