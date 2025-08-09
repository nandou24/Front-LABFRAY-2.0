//EMPRESA
export interface IPersonaContacto {
  nombre: string;
  cargo: string;
  telefono: string;
  email?: string;
  principal?: boolean;
}

export interface IUbicacionSede {
  nombreSede: string;
  direccionSede: string;
  departamentoSede: string;
  provinciaSede: string;
  distritoSede: string;
  referenciasSede?: string;
  coordenadasMaps?: string; // URL de Google Maps o coordenadas lat,lng
  telefonoSede?: string;
  emailSede?: string;
  responsableSede?: string;
  cargoResponsable?: string;
  observacionesSede?: string;
  activa?: boolean;
}

export interface IEmpresa {
  _id?: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccionFiscal: string;
  departamento: string;
  provincia: string;
  distrito: string;
  cantidadTrabajadores: number;
  personasContacto: IPersonaContacto[];
  ubicacionesSedes: IUbicacionSede[];
  email?: string;
  telefono?: string;
  tipoEmpresa?: string; // 'Privada' | 'Publica' | 'Mixta'
  sector?: string; // 'Salud' | 'Educacion' | 'Mineria' | 'Construccion' | 'Otros'
  fechaRegistro?: Date;
  estado?: boolean;
  observaciones?: string;
}

export interface IEmpresaPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IEmpresaPostReturnDTO {
  ok: boolean;
  msg?: string;
  empresa: IEmpresa;
  errors?: string;
}

export interface IGetEmpresas {
  ok: boolean;
  search: string;
  empresas: IEmpresa[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface IGetEmpresaById {
  ok: boolean;
  search: string;
  empresa: IEmpresa;
}

export interface IEmpresaUpdateDTO {
  ok: boolean;
  msg?: string;
  empresa: IEmpresa;
  errors?: string;
}

export interface IEmpresaDeleteDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}
