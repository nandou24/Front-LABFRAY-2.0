export interface IProfesion {
  _id?: string;
  codProfesion: string;
  nombreProfesion: string;
  estadoProfesion: string;
}

export interface IProfesionPostResponseDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastProfesiones {
  ok: boolean;
  search: String;
  profesiones: IProfesion[];
}
