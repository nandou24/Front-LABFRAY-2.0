//PACIENTE
export interface IPaciente {
  _id?: string;
  hc: string;
  tipoDoc: string;
  nroDoc: string;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;
  fechaNacimiento: Date;
  sexoCliente: string;
  departamentoCliente: string;
  provinciaCliente: string;
  distritoCliente: string;
  direcCliente: string;
  mailCliente: string;
  phones: Array<any>[];
}

export interface IPacientePostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IPacientePostReturnDTO {
  ok: boolean;
  msg?: string;
  hc: string;
  paciente: IPaciente;
  errors?: string;
}

export interface IGetLastPatients {
  ok: boolean;
  search: String;
  pacientes: IPaciente[];
}
