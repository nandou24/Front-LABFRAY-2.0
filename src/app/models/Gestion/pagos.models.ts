//PAGO

import { IServicioCotizacion } from './cotizacionPersona.models';

export interface IPago {
  codPago: string;
  codCotizacion: string;
  estadoCotizacion: string;
  fechaCotizacion: Date;
  version: string;
  hc: string;
  nombreCompleto: string;
  tipoDoc: string;
  nroDoc: string;
  codSolicitante: string;
  nomSolicitante: string;
  profesionSolicitante: string;
  colegiatura: string;
  sumaTotalesPrecioLista: number;
  descuentoTotal: number;
  subTotal: number;
  igv: number;
  total: number;
  serviciosCotizacion: IServicioCotizacion[];
  detallePagos: IDetallePago[];
  faltaPagar: number;
  subTotalFacturar: number;
  igvFacturar: number;
  totalFacturar: number;
  estadoPago: string;
  tienePagosAnteriores: boolean;
}

export interface IDetallePago {
  fechaPago: Date;
  medioPago: string;
  monto: number;
  recargo: number;
  numOperacion: string;
  bancoDestino: string;
  esAntiguo: boolean;
}

export interface IPagoPostDTOResponse {
  ok: boolean;
  msg?: string;
  errors?: {
    faltaHC?: boolean;
    [key: string]: any; // <- para otros posibles errores en el futuro
  };
  data?: any;
}

export interface IGetLastPagos {
  ok: boolean;
  search: String;
  pagos: IPago[];
}

export interface IGetDetallePago {
  ok: boolean;
  search: String;
  detallePago: IDetallePago[];
}
