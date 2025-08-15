export interface ICotizacionEmpresa {
  _id?: string;
  codCotizacion: string;
  historial: IHistorialCotizacionEmpresa[];
  estadoCotizacion: string;
}

// 🔥 Estructura del historial de cotización
export interface IHistorialCotizacionEmpresa {
  version: number;
  fechaModificacion: Date | null;
  empresaId: string;
  ruc: string;
  razonSocial: string;
  formaPago: string;
  diasCredito: number;
  entregaResultados: number;
  aplicarPrecioGlobal: boolean;
  aplicarDescuentoPorcentGlobal: boolean;
  sumaTotalesPrecioLista: number;
  descuentoTotal: number;
  precioConDescGlobal?: number;
  descuentoPorcentaje?: number;
  subTotal: number;
  igv: number;
  total: number;
  serviciosCotizacion: IServicioCotizacionEmpresa[];
}

export interface IServicioCotizacionEmpresa {
  servicioId: string;
  codServicio: string;
  tipoServicio: string;
  nombreServicio: string;
  cantidad: number;
  precioLista: number;
  diferencia: number;
  precioVenta: number;
  descuentoPorcentaje: number;
  nuevoPrecioVenta: number;
  totalUnitario: number;
}

export interface ICotizacionPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastCotizacion {
  ok: boolean;
  search: String;
  cotizaciones: ICotizacionEmpresa[];
}
