//PRUEBA LAB

import { IItemLab } from './items.models';

export interface IPruebaLab {
  _id?: string;
  pruebaLabId: string;
  codPruebaLab: string;
  areaLab: string;
  nombrePruebaLab: string;
  condPreAnalitPaciente: string;
  condPreAnalitRefer: string;
  tipoMuestra: string[];
  tipoTuboEnvase: string[];
  tiempoEntrega: string;
  observPruebas: string;
  estadoPrueba: string;
  itemsComponentes: IItemLab[];
}

export interface IPruebaLabPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastPruebasLab {
  ok: boolean;
  search: String;
  pruebasLab: IPruebaLab[];
}
