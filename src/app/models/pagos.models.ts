//PAGO

import { IServicioCotizacion } from "./cotizacionPersona.models";

export interface IPago {
    codPago: string,
    codCotizacion: string,
    estadoCotizacion: string
    version: string,
    codCliente: string,
    nomCliente: string,
    tipoDoc: string,
    nroDoc: string,
    codSolicitante: string,
    nomSolicitante: string,
    profesionSolicitante: string,
    colegiatura: string,
    sumaTotalesPrecioLista: number,
    descuentoTotal: number,
    subTotal: number,
    igv: number,
    total: number,
    serviciosCotizacion: IServicioCotizacion[],
    detallePagos: IDetallePago[],
    faltaPagar: number,
    subTotalFacturar: number,
    igvFacturar: number,
    totalFacturar: number,
    estadoPago: string,
    tienePagosAnteriores: string
    
}

export interface IDetallePago {
    medioPago: string,
    monto: number,
    montoConRecargo: number,
    numOperacion: string,
    fechaPago: Date,
    banco: string,
    esAntiguo: boolean
}

export interface IPagoPostDTO {
    ok: boolean;
    msg?: string;
    errors?: string[];
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
    detallePago: IDetallePago[]
}