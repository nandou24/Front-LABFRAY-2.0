import {
  ClaseServicio,
  IOrigenServicioExpandido,
  IProfesionEspecialidad,
  IServicioIncluido,
  ModalidadInstanciasServicio,
  TipoServicio,
} from '../Mantenimiento/servicios.models';

import { IPruebaLab } from '../Mantenimiento/pruebaLab.models';

// ====== Cotización ======

export interface ICotizacion {
  _id?: string;
  codCotizacion: string;
  historial: IHistorialCotizacion[];
  estadoCotizacion: string;
}

// ====== Historial ======

export interface IHistorialCotizacion {
  version: number;
  fechaModificacion: Date | null;

  estadoRegistroPaciente: boolean;

  clienteId: string;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;

  hc: string;
  tipoDoc: string;
  nroDoc: string;

  estadoRegistroSolicitante: boolean;

  codSolicitante?: string;
  solicitanteId?: string;

  nombreRefMedico?: string;
  apePatRefMedico?: string;
  apeMatRefMedico?: string;

  profesionSolicitante?: string;
  colegiatura?: string;
  especialidadSolicitante?: string;

  aplicarPrecioGlobal: boolean;
  aplicarDescuentoPorcentGlobal: boolean;

  sumaTotalesPrecioLista: number;
  descuentoTotal: number;

  precioConDescGlobal?: number;
  descuentoPorcentaje?: number;

  subTotal: number;
  igv: number;
  total: number;

  serviciosCotizacion: IServicioCotizacion[];
}

// ====== Profesional seleccionado ======

export interface IMedicoAtiendeCotizacion {
  medicoId: string;
  codRecHumano: string;

  apePatRecHumano: string;
  apeMatRecHumano: string;
  nombreRecHumano: string;

  nroColegiatura: string;
  rne: string;
}

// ====== Servicio cotizado ======

export interface IServicioCotizacion {
  servicioId: string;
  codServicio: string;

  // Compatibilidad con cotizaciones históricas.
  claseServicio?: ClaseServicio;

  tipoServicio: TipoServicio | null;

  nombreServicio: string;

  cantidad: number;

  precioLista: number;
  diferencia: number;

  precioVenta: number;
  descuentoPorcentaje: number;

  nuevoPrecioVenta: number;
  totalUnitario: number;

  // Compatibilidad con cotizaciones históricas.
  requiereSeleccionProfesional?: boolean;

  profesionesAsociadas: IProfesionEspecialidad[];

  medicoAtiende?: IMedicoAtiendeCotizacion | null;

  // Solo tendrá contenido para paquetes.
  serviciosIncluidos?: IServicioIncluido[];
}

// ====== Fuente de composición ======

export type FuenteComposicionCotizacion =
  | 'DIRECTO'
  | 'SNAPSHOT_COTIZACION'
  | 'MAESTRO_ACTUAL_FALLBACK';

// ====== Unidad laboratorio de cotización ======

export interface IUnidadLaboratorioCotizacion {
  claveUnidad: string;

  lineaCotizacion: number;

  servicioId: string;
  codServicio: string;
  nombreServicio: string;

  cantidadCotizada: number;
  cantidadEnPaquete: number;
  cantidadServicio: number;

  numeroServicio: number;

  origenServicio: IOrigenServicioExpandido;

  fuenteComposicion: FuenteComposicionCotizacion;

  pruebaLabId: string;

  codExamen: string;
  nombreExamen: string;

  modalidadInstancias: ModalidadInstanciasServicio;

  numeroInstancias: number;
  numeroInstancia: number;

  etiquetaInstancia: string | null;
}

// ====== Resumen laboratorio ======

export interface IResumenLaboratorioCotizacion {
  lineasCotizacion: number;
  pruebasLab: number;
  unidadesLaboratorio: number;
}

// ====== Respuesta resolver laboratorio ======

export interface IResolverLaboratorioCotizacionResponse {
  ok: boolean;
  msg?: string;

  pruebasLab: IPruebaLab[];

  unidadesLaboratorio: IUnidadLaboratorioCotizacion[];

  resumen: IResumenLaboratorioCotizacion;

  advertencias: string[];
}

// ====== Respuestas HTTP ======

export interface ICotizacionPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
  cotizacion?: ICotizacion;
}

export interface IGetLastCotizacion {
  ok: boolean;
  search: String;
  cotizaciones: ICotizacion[];
}
