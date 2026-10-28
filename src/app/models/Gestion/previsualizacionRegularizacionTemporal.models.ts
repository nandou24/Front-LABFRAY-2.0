// ====== Resultado de verificación sin escritura ======
export type TipoDocumentoRegularizacion = 'DNI' | 'CE' | 'PASAPORTE';

export interface DocumentoConsultado {
  tipoDoc: TipoDocumentoRegularizacion;
  nroDoc: string;
}

export interface CandidatoRegularizacionTemporal {
  pacienteId: string;
  hc: string | null;
  tipoDoc: string | null;
  nroDoc: string | null;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;
  fechaNacimiento?: string | Date | null;
  sexoCliente?: string | null;
  documentoExacto?: boolean;
  nombresExactos?: boolean;
  identificacionPendiente?: boolean;
  vinculacionPermitida?: boolean;
  tipoCoincidencia: string;
}

export interface PrevisualizacionRegularizacionTemporalResponse {
  ok: boolean;
  soloLectura: boolean;
  documento: DocumentoConsultado;
  programacion: {
    _id: string;
    codProgramacion: string;
    nombreCliente: string;
    apePatCliente: string;
    apeMatCliente: string;
    identidadTemporalActiva: boolean;
    estadoProgramacion: string;
  };
  solicitudes: Array<{
    _id: string;
    codSolicitud: string;
    codigoLaboratorio: string | null;
  }>;
  porDocumento: CandidatoRegularizacionTemporal[];
  porNombres: CandidatoRegularizacionTemporal[];
  porHistorialDocumento: CandidatoRegularizacionTemporal[];
  pacientesUnicos: number;
  estadoRevision: 'REQUIERE_REVISION_IDENTIDAD' | 'SIN_COINCIDENCIAS';
  msg: string;
}

// ====== B.2.2A Confirmación de HC existente ======
export interface RegularizarTemporalHCExistenteRequest extends DocumentoConsultado {
  pacienteId: string;
  hcConfirmada: string;
  confirmacionExpresa: true;
  confirmacionDiscrepancia: boolean;
  motivoDecision?: string;
}

export interface RegularizarTemporalHCExistenteResponse {
  ok: boolean;
  codigo: 'REGULARIZACION_COMPLETADA';
  msg: string;
  programacion: {
    _id: string;
    codProgramacion: string;
    identidadTemporalActiva: false;
    tipoDoc: string;
    nroDoc: string;
    pacienteId: string;
    hc: string;
  };
  solicitudesActualizadas: Array<{
    _id: string;
    codSolicitud: string;
    codigoLaboratorio: string | null;
    identidadAtencion: string;
  }>;
  fotografiasSinModificar: boolean;
}
