// ====== Estado operativo genérico ======

export type CodigoEstadoOperativoLaboratorio =
  | 'PENDIENTE_MUESTRAS'
  | 'MUESTRAS_COMPLETADAS'
  | 'MUESTRAS_ACEPTADAS'
  | 'PENDIENTE_RESULTADOS'
  | 'RESULTADOS_EN_PROCESO'
  | 'RESULTADOS_DISPONIBLES_PARCIALMENTE'
  | 'RESULTADOS_COMPLETOS'
  | 'RESULTADOS_VALIDADOS'
  | 'RESULTADOS_LIBERADOS'
  | 'ANULADO';

export interface IResumenMuestrasEstadoOperativo {
  requiereMuestra: boolean;

  totalDocumentos: number;

  recipientesPlanificados: number;

  unidadesRequierenMuestra: number;

  unidadesSinCoberturaVigente: number;

  vigentes: {
    total: number;

    pendientes: number;

    recolectadas: number;

    recepcionadas: number;

    aceptadas: number;

    rechazadas: number;

    sinIntentoVigente: number;
  };
}

export interface IResumenResultadosEstadoOperativo {
  total: number;

  totalDocumentos: number;

  sinInicializar: number;

  pendientes: number;

  enProceso: number;

  completos: number;

  validados: number;

  liberados: number;

  anulados: number;

  disponibles: number;
}

export interface IResumenUnidadesEstadoOperativo {
  total: number;

  activas: number;

  pendientes: number;

  enProceso: number;

  terminadas: number;

  anuladas: number;
}

export interface IEstadoOperativoSolicitud {
  dominio: string;

  codigo: CodigoEstadoOperativoLaboratorio | string;

  descripcion: string;

  estadoPrincipalSugerido: string;

  puedeRetirarsePaciente?: boolean;

  tieneResultadosDisponibles?: boolean;

  resultadosDisponibles?: number;

  requiereMuestra?: boolean;

  hayObligacionPendientePaciente?: boolean;

  resumen?: {
    muestras: IResumenMuestrasEstadoOperativo;

    resultados: IResumenResultadosEstadoOperativo;

    unidades: IResumenUnidadesEstadoOperativo;
  };
}
