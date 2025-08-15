export type EstadoAtencion =
  | 'PENDIENTE_PROGRAMAR'
  | 'PROGRAMADA'
  | 'ATENDIDA'
  | 'FACTURADA'
  | 'PAGO_PARCIAL'
  | 'PAGADA'
  | 'ANULADA';

export interface IAtencionEmp {
  _id?: string;
  empresaId: string;
  servicioTipo: 'ETAs' | 'Campaña' | 'Consulta' | 'Otro';
  fechaRegistro: string;

  programaciones: Array<{
    fecha: string; // día programado
    horaInicio?: string;
    horaFin?: string;
    sedeEmpresa?: string;
    direccion?: string;
    linkMaps?: string;
    personalInternoIds?: string[];
    estado: 'PROGRAMADA' | 'ATENDIDA' | 'NO_REALIZADA';
    observacion?: string;
    archivos?: string[]; // fotos/actas de ese día
  }>;

  facturacion?: {
    serie?: string;
    numero?: string;
    emision?: string;
    vencimiento?: string;
    subtotal?: number;
    igv?: number;
    total?: number;
    aplicaDetraccion?: boolean;
    porcDetraccion?: number;
    archivos?: string[]; // PDF/imagen factura
  };

  pagos?: Array<{
    fecha: string;
    medio: 'TRANSFERENCIA' | 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'OTRO';
    referencia?: string;
    monto?: number;
    observacion?: string;
    archivos?: string[]; // capturas
  }>;

  detraccion?: {
    nroConstancia?: string;
    fecha?: string;
    monto?: number;
    banco?: 'BN' | 'OTRO';
    archivos?: string[];
  };

  totales?: {
    pagadoNeto: number;
    detraccion: number;
    cobertura: number;
    saldo: number;
  };
  estado: EstadoAtencion;
  contactosEmpresa?: Array<{
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
  }>;
  linksResultados?: string[]; // URLs a informes/resultados
  archivosGenerales?: string[]; // otros adjuntos
}
