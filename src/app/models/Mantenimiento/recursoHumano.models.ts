import { IRol } from '../permisos/roles.models';

interface IEspecialidadRRHH {
  _id?: string;
  //codEspecialidad: string;
  especialidadRef: any;
  rne: string;
  centroEstudiosEspecialidad?: string;
  anioEgresoEspecialidad?: string;
}

export interface IProfesionRRHH {
  _id?: string;
  //codProfesion: string;
  profesionRef: any;
  nivelProfesion?: string;
  titulo: boolean;
  nroColegiatura?: string;
  centroEstudiosProfesion?: string;
  anioEgresoProfesion?: string;
  especialidades: IEspecialidadRRHH[];
}

export interface IPresentacionFirmaRRHH {
  perfilId: string;
  etiqueta: string;
  tratamiento: string;
  profesionRecursoId: string;
  especialidadId: string | null;
  mostrarProfesion: boolean;
  mostrarEspecialidad: boolean;
  mostrarColegiatura: boolean;
  mostrarRne: boolean;
  siglaColegiatura: string;
  siglaEspecialidad: string;
  serviciosAutorizados: string[];
  esPrincipal: boolean;
}

export interface IFirmaConfigProfesional {
  habilitado: boolean;
  profesionRecursoId: string | null;
  serviciosAutorizados: string[];
  predeterminadoLaboratorio: boolean;
  referenciaAutorizacion: string;
  presentaciones?: IPresentacionFirmaRRHH[];
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
  atiendeConsultas: boolean;
  firmaLaboratorio?: IFirmaConfigProfesional; // si atiende consultas
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
  nombreRecHumano: string;
  apePatRecHumano: string;
  apeMatRecHumano: string;
  profesion: string;
  nroColegiatura?: string;
  rne?: string;
}

export interface IGetPersonalSaludParaConsultas {
  ok: boolean;
  recHumanos: IRecHumano[];
}
