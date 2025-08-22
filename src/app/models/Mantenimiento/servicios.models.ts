import { IPersonalSaludParaConsultas } from './recursoHumano.models';

//SERVICIO
export interface IProfesionEspecialidad {
  profesionId: string;
  especialidadId?: string; // opcional
}

export interface IServicio {
  _id?: string;
  codServicio: string;
  tipoServicio: string;
  nombreServicio: string;
  descripcionServicio: string;
  medicoAtiende: IPersonalSaludParaConsultas | null;
  precioServicio: number;
  estadoServicio: string;
  favoritoServicio: boolean;
  favoritoServicioEmpresa: boolean;
  examenesServicio: Array<any>[];
  profesionesAsociadas: IProfesionEspecialidad[];
}

export interface IServicioPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastServicio {
  ok: boolean;
  search: String;
  servicios: IServicio[];
}

export interface IGetLastExamenes {
  ok: boolean;
  search: String;
  examenes: Array<any>[];
}
