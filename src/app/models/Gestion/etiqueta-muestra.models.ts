import { EstadoMuestraLaboratorio } from '../../models/Gestion/muestraLaboratorio.models';

export type ResolucionTipoMuestraEtiqueta =
  | 'REAL'
  | 'UNICA_OPCION'
  | 'POR_DEFINIR';

export interface IEtiquetaMuestra {
  muestraLaboratorioId: string;

  numeroRecipiente: number;
  numeroIntento: number;
  estadoMuestra: EstadoMuestraLaboratorio;

  nombrePaciente: string;
  tipoDocumento: string;
  numeroDocumento: string;

  codigoLaboratorio: string;
  codigoLaboratorioPrefijo: string;
  correlativoMensual: string | null;

  codigoEtiqueta: string;
  codigoEtiquetaSufijo: string;

  tipoMuestra: string;
  resolucionTipoMuestra: ResolucionTipoMuestraEtiqueta;
}
