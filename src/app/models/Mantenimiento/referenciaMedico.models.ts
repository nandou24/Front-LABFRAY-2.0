export interface IRefMedico {
  _id?: string;
  codRefMedico: string;
  tipoDoc: string;
  nroDoc: string;
  nombreRefMedico: string;
  apePatRefMedico: string;
  apeMatRefMedico: string;
  fechaNacimiento: Date;
  sexoRefMedico: string;
  departamentoRefMedico: string;
  provinciaRefMedico: string;
  distritoRefMedico: string;
  direcRefMedico: string;
  mailRefMedico: string;
  phones: Array<any>[];
  profesionesRefMedico: Array<any>[];
  profesionSolicitante: {
    profesion: string;
    nroColegiatura: string;
  } | null;
  especialidadesRefMedico: Array<any>[];
}

export interface IRefMedicoPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastRefMedico {
  ok: boolean;
  search: String;
  refMedicos: IRefMedico[];
}

export interface IGetLastRefMedicoById {
  ok: boolean;
  search: String;
  solicitante: IRefMedico;
}
