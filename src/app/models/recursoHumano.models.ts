import { IRol } from './permisos/roles.models';

export interface IRecHumano {
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
  profesionesRecurso: Array<any>[];
  profesionSolicitante: {
    profesion: string;
    nroColegiatura: string;
  } | null;
  especialidadesRecurso: Array<any>[];
  especialidadesTexto: string;
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

export interface IRecHumanoPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastRecHumano {
  ok: boolean;
  search: String;
  recHumanos: IRecHumano[];
}
