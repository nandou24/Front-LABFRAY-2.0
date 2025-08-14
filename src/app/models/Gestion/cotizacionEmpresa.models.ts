import { IProfesionEspecialidad } from '../Mantenimiento/servicios.models';

export interface ICotizacion {
  _id?: string;
  codCotizacion: string;
  historial: IHistorialCotizacion[];
  estadoCotizacion: string;
}

// 🔥 Estructura del historial de cotización
export interface IHistorialCotizacion {
  version: number;
  fechaModificacion: Date | null;
  estadoRegistroPaciente: boolean;
  empresaId: string;
  razonSocial: string;
  ruc: string;
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
  cotizaciones: ICotizacion[];
}
