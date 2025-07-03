export interface ICotizacion {
  codCotizacion: string;
  historial: IHistorialCotizacion[];
  estadoCotizacion: string;
}

// 🔥 Estructura del historial de cotización
export interface IHistorialCotizacion {
  version: number;
  fechaModificacion: Date | null;
  estadoRegistroPaciente: boolean;
  nombreCompleto: string;
  hc: string;
  tipoDoc: string;
  nroDoc: string;
  estadoRegistroSolicitante: boolean;
  codSolicitante?: string;
  nomSolicitante?: string;
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

export interface IServicioCotizacion {
  codServicio: string;
  tipoServicio: string;
  nombreServicio: string;
  cantidad: number;
  precioLista: number;
  diferencia: number;
  precioVenta: number;
  descuentoPorcentaje: number;
  totalUnitario: number;
  medicoAtiende?: {
    medicoId: string;
    nombreCompletoMedico: string;
    nroColegiatura: string;
    colegiatura: string;
    rne: string;
    especialidad: string;
  };
}

export interface ICotizacionPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastCotizacion {
  ok: boolean;
  search: String;
  cotizaciones: ICotizacion[];
}
