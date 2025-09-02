// MODELOS PARA ARQUEO DE CAJA

import { IDetallePago } from '../Gestion/pagos.models';

export interface IArqueoCaja {
  codArqueo: string;
  fecha: Date;
  fechaCreacion: Date;
  usuarioArqueo: string;
  codUsuarioArqueo: string;
  turno: 'MAÑANA' | 'TARDE' | 'NOCHE';
  sede: string;
  montoApertura: number;
  montoCierre: number;
  montoSistema: number;
  diferencia: number;
  estado: 'ABIERTO' | 'CERRADO' | 'CUADRADO' | 'DIFERENCIA';
  observaciones?: string;
  detalleDenominaciones: IDetalleDenominacion[];
  detalleMovimientos: IDetalleMovimientoArqueo[];
  totalEfectivoSistema: number;
  totalEfectivoFisico: number;
}

export interface IDetalleDenominacion {
  denominacion: number; // 0.10, 0.20, 0.50, 1, 2, 5, 10, 20, 50, 100, 200
  tipo: 'MONEDA' | 'BILLETE';
  cantidad: number;
  subtotal: number;
}

export interface IDetalleMovimientoArqueo {
  codPago: string;
  codCotizacion: string;
  fechaPago: Date;
  nombreCompleto: string;
  tipoDoc: string;
  nroDoc: string;
  montoEfectivo: number;
  usuario: string;
}

export interface IArqueoPostDTO {
  fecha: Date;
  turno: 'MAÑANA' | 'TARDE' | 'NOCHE';
  sede: string;
  montoApertura: number;
  montoCierre: number;
  observaciones?: string;
  detalleDenominaciones: IDetalleDenominacion[];
}

export interface IArqueoResponse {
  ok: boolean;
  msg?: string;
  data?: IArqueoCaja;
}

export interface IGetArqueos {
  ok: boolean;
  arqueos: IArqueoCaja[];
}

export interface IResumenDiario {
  fecha: Date;
  totalPagosEfectivo: number;
  cantidadPagos: number;
  montoApertura?: number;
  montoCierre?: number;
  diferencia?: number;
  estado: string;
  usuarioArqueo?: string;
}

// Denominaciones estándar del Perú
export const DENOMINACIONES_PERU = [
  { valor: 0.1, tipo: 'MONEDA' as const, nombre: '10 céntimos' },
  { valor: 0.2, tipo: 'MONEDA' as const, nombre: '20 céntimos' },
  { valor: 0.5, tipo: 'MONEDA' as const, nombre: '50 céntimos' },
  { valor: 1, tipo: 'MONEDA' as const, nombre: '1 sol' },
  { valor: 2, tipo: 'MONEDA' as const, nombre: '2 soles' },
  { valor: 5, tipo: 'MONEDA' as const, nombre: '5 soles' },
  { valor: 10, tipo: 'BILLETE' as const, nombre: '10 soles' },
  { valor: 20, tipo: 'BILLETE' as const, nombre: '20 soles' },
  { valor: 50, tipo: 'BILLETE' as const, nombre: '50 soles' },
  { valor: 100, tipo: 'BILLETE' as const, nombre: '100 soles' },
  { valor: 200, tipo: 'BILLETE' as const, nombre: '200 soles' },
];
