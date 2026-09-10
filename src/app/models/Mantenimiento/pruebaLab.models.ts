// ====== Prueba laboratorio ======

import { IItemLab } from './items.models';

// ====== Tipos generales ======

export type EstadoPruebaLab = 'ACTIVO' | 'INACTIVO';
export type TipoProcesamientoLab = 'INTERNO' | 'REFERENCIA';
export type AlcanceRequerimientoMuestra = 'TODA_PRUEBA' | 'ITEMS_ESPECIFICOS';
export type UnidadVolumen = 'uL' | 'mL' | 'L';

// ====== Procesamiento ======

export interface IProcesamientoLab {
  tipo: TipoProcesamientoLab;
  laboratorioReferenciaId?: string | null;
  observacion?: string;
}

// ====== Item dentro de grupo de resultados ======

export interface IItemGrupoResultado {
  // Puede recibirse como ObjectId o populado desde backend.
  itemLabId: string | IItemLab;
  ordenItem?: number;
  mostrarItem?: boolean;

  // null = hereda del grupo o de la prueba.
  procesamientoOverride?: IProcesamientoLab | null;
}

// ====== Grupo de resultados ======

export interface IGrupoResultado {
  _id?: string;
  nombreGrupo?: string;
  ordenGrupo?: number;
  mostrarTitulo?: boolean;

  // null = hereda procesamiento de la prueba.
  procesamientoOverride?: IProcesamientoLab | null;
  items: IItemGrupoResultado[];
}

// ====== Opción de muestra ======

export interface IOpcionMuestra {
  tipoMuestraId: string;
  tuboEnvaseId: string;
}

// ====== Requerimiento de muestra ======

export interface IRequerimientoMuestra {
  _id?: string;
  descripcion?: string;
  alcance: AlcanceRequerimientoMuestra;

  // Las opciones del mismo requerimiento funcionan como OR.
  opciones: IOpcionMuestra[];

  // Solo aplica cuando alcance === 'ITEMS_ESPECIFICOS'.
  itemsAsociados?: string[];
  cantidadRecipientes?: number;
  volumenMinimo?: number | null;
  unidadVolumen?: UnidadVolumen | null;
  permiteCompartirMuestra?: boolean;
  observacion?: string;
}

// ====== Legacy temporal ======

export interface IItemComponenteLegacy {
  itemLabId: string | IItemLab;
}

// ====== Prueba de laboratorio ======

export interface IPruebaLab {
  _id?: string;
  pruebaLabId?: string;
  codPruebaLab?: string;
  areaLab: string;
  nombrePruebaLab: string;
  condPreAnalitPaciente: string;
  condPreAnalitRefer: string;
  tiempoRespuesta: string;
  observPruebas?: string;
  estadoPrueba: EstadoPruebaLab;

  // ====== Legacy temporal ======

  tipoMuestra?: string[];
  tipoTuboEnvase?: string[];
  ordenImpresion?: number;
  itemsComponentes?: IItemComponenteLegacy[];

  // ====== Composición ======

  gruposResultado?: IGrupoResultado[];

  // ====== Procesamiento ======

  procesamientoDefault?: IProcesamientoLab;

  // ====== Muestras ======

  requiereMuestra?: boolean;
  requerimientosMuestra?: IRequerimientoMuestra[];

  // ====== Auditoría ======

  createdBy?: string;
  usuarioRegistro?: string;
  fechaRegistro?: string | Date;
  updatedBy?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ====== Respuesta crear / actualizar ======

export interface IPruebaLabPostDTO {
  ok: boolean;
  msg?: string;
  errors?: any;
  pruebaLab?: IPruebaLab;
}

// ====== Respuesta listado ======

export interface IGetLastPruebasLab {
  ok: boolean;
  search?: string;
  pruebasLab: IPruebaLab[];
}
