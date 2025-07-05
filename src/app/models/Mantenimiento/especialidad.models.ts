export interface IEspecialidad {
  codProfesion: string;
  nombreProfesion: string;
  estadoProfesion: string;
}

export interface IEspecialidadPostResponseDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastEspecialidades {
  ok: boolean;
  search: String;
  especialidades: IEspecialidad[];
}
