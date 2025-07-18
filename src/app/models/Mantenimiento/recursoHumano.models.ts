import { IRol } from '../permisos/roles.models';

interface IEspecialidadRRHH {
  _id?: string;
  //codEspecialidad: string;
  especialidadRef: string;
  rne: string;
  centroEstudiosEspecialidad?: string;
  anioEgresoEspecialidad?: string;
}

interface IProfesionRRHH {
  _id?: string;
  //codProfesion: string;
  profesionRef: string;
  nivelProfesion?: string;
  titulo: boolean;
  nroColegiatura?: string;
  centroEstudiosProfesion?: string;
  anioEgresoProfesion?: string;
  especialidades: IEspecialidadRRHH[];
}

export interface IRecHumano {
  _id?: string;
  codRecHumano: string;
  tipoDoc: string;
  nroDoc: string;
  nombreRecHumano: string;
  apePatRecHumano: string;
  apeMatRecHumano: string;
  fechaNacimiento: Date;
  sexoRecHumano: string;
  departamentoRecHumano: string;
  provinciaRecHumano: string;
  distritoRecHumano: string;
  direcRecHumano: string;
  mailRecHumano: string;
  phones: Array<any>[];
  gradoInstruccion: string;
  profesionesRecurso: IProfesionRRHH[];
  atiendeConsultas: boolean; // si atiende consultas
  usuarioSistema: boolean;
  datosLogueo: {
    nombreUsuario: string; // solo si accede al sistema
    correoLogin: string; // para login
    passwordHash: string; // bcrypt
    rol: IRol;
    sedeAsignada: string; // código de sede
    estado: boolean; // activo o no para el sistema
  };
}

export interface IRecHumanoPostResponseDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastRecHumano {
  ok: boolean;
  search: String;
  recHumanos: IRecHumano[];
}

export interface IPersonalSaludParaConsultas {
  _id: string;
  codRecHumano: string;
  nombreCompletoPersonal: string;
}

export interface IGetPersonalSaludParaConsultas {
  ok: boolean;
  recHumanos: IRecHumano[];
}
