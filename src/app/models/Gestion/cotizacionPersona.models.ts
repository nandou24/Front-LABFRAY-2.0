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
  totalUnitario: number;
  profesionesAsociadas: IProfesionEspecialidad[];
  medicoAtiende?: {
    medicoId: string;
    codRecHumano: string;
    apePatRecHumano: string;
    apeMatRecHumano: string;
    nombreRecHumano: string;
    nroColegiatura: string;
    rne: string;
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
