import { IPersonalSaludParaConsultas } from './recursoHumano.models';
import { IPruebaLab } from './pruebaLab.models';

// ====== Tipos generales ======

export type ClaseServicio = 'INDIVIDUAL' | 'PAQUETE';

export type TipoServicio =
  | 'Laboratorio'
  | 'Ecografía'
  | 'Rayos X'
  | 'Consulta'
  | 'Procedimiento';

export type TipoExamenServicio =
  | 'LABORATORIO'
  | 'ECOGRAFIA'
  | 'RAYOS_X'
  | 'CONSULTA'
  | 'PROCEDIMIENTO';

export type ModalidadInstanciasServicio =
  | 'UNICA'
  | 'MUESTRAS_INDEPENDIENTES'
  | 'REPETICIONES_MISMA_MUESTRA';

// ====== Profesiones asociadas ======

export interface IProfesionEspecialidad {
  profesionId: string;
  especialidadId?: string | null;
}

export interface IExamenServicio {
  _id?: string;

  tipoExamen: TipoExamenServicio;

  referenciaId?: string | null;

  codExamen: string;
  nombreExamen: string;

  numeroInstancias: number;
  modalidadInstancias: ModalidadInstanciasServicio;
  etiquetasInstancias: string[];
}

// ====== Servicio incluido en paquete ======

export interface IServicioIncluido {
  servicioId: string;
  cantidad: number;
}

// ====== Servicio ======

export interface IServicio {
  _id?: string;

  codServicio: string;

  // ====== Clasificación ======

  claseServicio: ClaseServicio;

  // null cuando claseServicio === 'PAQUETE'.
  tipoServicio: TipoServicio | null;

  // ====== Datos generales ======

  nombreServicio: string;
  descripcionServicio: string | null;
  precioServicio: number;
  estadoServicio: boolean;

  favoritoServicio: boolean;
  favoritoServicioEmpresa: boolean;

  // ====== Configuración profesional ======

  requiereSeleccionProfesional: boolean;
  profesionesAsociadas: IProfesionEspecialidad[];

  // ====== Composición clínica ======

  examenesServicio: IExamenServicio[];

  // ====== Composición comercial ======

  serviciosIncluidos: IServicioIncluido[];

  // ====== Compatibilidad frontend ======

  // Campo no persistido actualmente en Servicio.
  // Se conserva temporalmente por compatibilidad con módulos existentes.
  medicoAtiende?: IPersonalSaludParaConsultas | null;

  // ====== Auditoría ======

  createdBy?: string;
  usuarioRegistro?: string;
  fechaRegistro?: string | Date;

  updatedBy?: string | null;
  usuarioActualizacion?: string;
  fechaActualizacion?: string | Date | null;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ====== Origen de servicio expandido ======

export interface IOrigenServicioExpandido {
  claseServicio: ClaseServicio;

  servicioOrigenId: string;
  codServicioOrigen: string;
  nombreServicioOrigen: string;
}

// ====== Servicio expandido ======

export interface IServicioExpandido {
  servicioId: string;

  codServicio: string;

  claseServicio: ClaseServicio;
  tipoServicio: TipoServicio | null;

  nombreServicio: string;
  descripcionServicio: string | null;

  precioServicio: number;
  estadoServicio: boolean;

  requiereSeleccionProfesional: boolean;
  profesionesAsociadas: IProfesionEspecialidad[];

  examenesServicio: IExamenServicio[];

  cantidad: number;

  origen: IOrigenServicioExpandido;
}

// ====== Respuesta servicios expandidos ======

export interface IGetServiciosExpandidos {
  ok: boolean;
  msg?: string;
  serviciosExpandidos: IServicioExpandido[];
}

// ====== Componente laboratorio por servicio ======

export interface IComponenteLaboratorioServicio {
  servicioId: string;

  codServicio: string;
  nombreServicio: string;

  cantidadServicio: number;

  origenServicio: IOrigenServicioExpandido;

  referenciaId: string;

  codExamen: string;
  nombreExamen: string;

  numeroInstancias: number;
  modalidadInstancias: ModalidadInstanciasServicio;
  etiquetasInstancias: string[];
}

// ====== Respuesta laboratorio por servicios ======

export interface IGetLaboratorioPorServicios {
  ok: boolean;
  msg?: string;

  pruebasLab: IPruebaLab[];
  componentesLaboratorio: IComponenteLaboratorioServicio[];
}

// ====== Respuesta crear / actualizar ======

export interface IServicioPostDTO {
  ok: boolean;
  msg?: string;
  errors?: any;
  servicio?: IServicio;
}

// ====== Respuesta listado ======

export interface IGetLastServicio {
  ok: boolean;
  search?: string;
  servicios: IServicio[];
}

// ====== Respuesta listado de exámenes ======

// Temporal: este endpoint retorna maestros diferentes
// según el tipo solicitado.
export interface IGetLastExamenes {
  ok: boolean;
  search?: string;
  examenes: any[];
}
