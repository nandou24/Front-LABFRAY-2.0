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
  fechaRegistro: Date;

  programaciones: Array<{
    fechas: Array<{
      fecha: Date; // día programado
      horaInicio?: string;
      horaFin?: string;
    }>;
    sedeEmpresa?: string;
    direccion?: string;
    linkMaps?: string;
    personalAsignado?: string[];
    estado: 'PROGRAMADA' | 'ATENDIDA' | 'NO_REALIZADA';
    observacion?: string;
    archivos?: string[]; // fotos/actas de ese día
  }>;

  facturacion?: Array<{
    serie?: string;
    numero?: string;
    fechaEmision?: Date;
    vencimiento?: string;
    subtotal?: number;
    igv?: number;
    total?: number;
    aplicaDetraccion?: boolean;
    porcDetraccion?: number;
    archivos?: string[]; // PDF/imagen factura
    detraccion?: {
      nroConstancia?: string;
      fecha?: Date;
      monto?: number;
      banco?: 'BN' | 'OTRO';
      archivos?: string[];
    };
  }>;

  pagos?: Array<{
    fecha: Date;
    medio: 'TRANSFERENCIA' | 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'OTRO';
    referencia?: string;
    monto?: number;
    observacion?: string;
    archivos?: string[]; // capturas
  }>;


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
