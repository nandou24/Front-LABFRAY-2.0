export interface IProfesionPopulada {
  _id: string;
  codProfesion: string;
  nombreProfesion: string;
}

export interface IEspecialidad {
  _id?: string;
  codEspecialidad: string;
  nombreEspecialidad: string;
  estadoEspecialidad: boolean;
  profesionRef: IProfesionPopulada;
}

export interface IEspecialidadPostResponseDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastEspecialidades {
  ok: boolean;
  search: string;
  especialidades: IEspecialidad[];
}
