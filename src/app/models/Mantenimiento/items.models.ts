// export interface IItemLab {
//   _id?: string;
//   codItemLab: string;
//   nombreInforme: string;
//   nombreHojaTrabajo: string;
//   metodoItemLab: string;
//   valoresHojaTrabajo: string;
//   valoresInforme: string;
//   unidadesRef: string;
//   perteneceAPrueba: {
//     _id: string;
//     codPruebaLab: string;
//     nombrePruebaLab: string;
//   };
//   ordenImpresion: number;
//   grupoItemLab: string;
//   poseeValidacion: string;
//   paramValidacion: Array<any>[];
// }

// export interface IItemLabPostDTO {
//   ok: boolean;
//   msg?: string;
//   errors?: string;
// }

// export interface IGetLastItemsLab {
//   ok: boolean;
//   search: String;
//   itemsLab: IItemLab[];
// }

// ==========================================================
// TIPOS GENERALES
// ==========================================================

export type TipoResultadoItem = 'NUMERICO' | 'TEXTO' | 'CATEGORICO';
export type EstadoItem = 'ACTIVO' | 'INACTIVO';
export type SexoReferencia = 'TODOS' | 'MASCULINO' | 'FEMENINO';
export type UnidadEdad = 'DIAS' | 'MESES' | 'ANIOS';

// ==========================================================
// REFERENCIA LEGACY A PRUEBALAB
// ==========================================================

export interface IPruebaItemLegacy {
  _id: string;

  codPruebaLab?: string;
  nombrePruebaLab?: string;
}

// ==========================================================
// VALIDACIÓN LEGACY
// Se mantiene temporalmente mientras migramos.
// ==========================================================

export interface IParamValidacionLegacy {
  descrValidacion?: string;
  sexo?: string;
  edadIndistinta?: boolean | string;
  edadMin?: string | number | null;
  edadMax?: string | number | null;
  descRegla?: string;
  valor1?: string | number | null;
  valor2?: string | number | null;
}

// ==========================================================
// REFERENCIAS DE RESULTADO - NUEVO MODELO
// ==========================================================

export type TipoReferenciaResultado =
  | 'RANGO'
  | 'MENOR_QUE'
  | 'MENOR_IGUAL_QUE'
  | 'MAYOR_QUE'
  | 'MAYOR_IGUAL_QUE'
  | 'VALORES_PERMITIDOS'
  | 'TEXTO';

export interface IReferenciaResultado {
  _id?: string;
  descripcion?: string;
  sexo?: SexoReferencia;
  edadMin?: number | null;
  edadMax?: number | null;
  unidadEdad?: UnidadEdad;
  tipoReferencia: TipoReferenciaResultado;
  valorMin?: number | null;
  valorMax?: number | null;
  valorLimite?: number | null;
  valoresPermitidos?: string[];
  textoReferencia?: string;
  activo?: boolean;
}

// ==========================================================
// REGLAS DE ALERTA - NUEVO MODELO
// ==========================================================

export type CondicionAlerta =
  | 'MENOR_QUE'
  | 'MENOR_IGUAL_QUE'
  | 'MAYOR_QUE'
  | 'MAYOR_IGUAL_QUE'
  | 'FUERA_DE_RANGO'
  | 'IGUAL_A'
  | 'DISTINTO_DE';

export type NivelAlerta = 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA';

export interface IReglaAlerta {
  _id?: string;
  descripcion?: string;
  sexo?: SexoReferencia;
  edadMin?: number | null;
  edadMax?: number | null;
  unidadEdad?: UnidadEdad;
  condicion: CondicionAlerta;
  valor1?: any;
  valor2?: any;
  nivelAlerta?: NivelAlerta;
  mensaje?: string;
  activo?: boolean;
}

// ==========================================================
// ITEM DE LABORATORIO
// ==========================================================

export interface IItemLab {
  _id?: string;
  codItemLab?: string;
  nombreInforme: string;
  nombreHojaTrabajo: string;
  metodoItemLab: string;
  valoresHojaTrabajo: string;
  valoresInforme: string;
  unidadesRef: string;

  // ========================================================
  // CAMPOS LEGACY
  // ========================================================

  /*
   * Temporalmente puede ser:
   *
   * - objeto poblado desde Mongo
   * - ObjectId string
   * - null para los nuevos Items
   */
  perteneceAPrueba?: IPruebaItemLegacy | string | null;
  ordenImpresion?: number;
  grupoItemLab?: string;
  poseeValidacion?: boolean;
  paramValidacion?: IParamValidacionLegacy[];

  // ========================================================
  // NUEVA ESTRUCTURA
  // ========================================================

  contextoAnalitico?: string;
  tipoResultado?: TipoResultadoItem;
  opcionesResultado?: string[];
  permiteValorNoListado?: boolean;
  estadoItem?: EstadoItem;
  referenciasResultado?: IReferenciaResultado[];
  reglasAlerta?: IReglaAlerta[];

  // ========================================================
  // AUDITORÍA
  // ========================================================

  createdBy?: string;
  usuarioRegistro?: string;
  fechaRegistro?: Date;
  updatedBy?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==========================================================
// RESPUESTAS API
// ==========================================================

export interface IItemLabPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
  itemLab?: IItemLab;
}

export interface IGetLastItemsLab {
  ok: boolean;
  search?: string;
  itemsLab: IItemLab[];
}
