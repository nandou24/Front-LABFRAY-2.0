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
  dirigidoA_Id: string;
  formaPago: string;
  diasCredito: number;
  entregaResultados: number;
  validez: number;
  aplicarPrecioGlobal: boolean;
  precioConDescGlobal: number | null;
  cantidadGlobal?: number;
  sumaTotalesPrecioLista: number;
  sumaTotalesPrecioVenta: number;
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
