export interface IItemLab {
  _id?: string;
  itemLabId: string;
  codItemLab: string;
  nombreInforme: string;
  nombreHojaTrabajo: string;
  metodoItemLab: string;
  valoresHojaTrabajo: string;
  valoresInforme: string;
  unidadesRef: string;
  perteneceAPrueba: string;
  grupoItemLab: string;
  poseeValidacion: string;
  paramValidacion: Array<any>[];
}

export interface IItemLabPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface IGetLastItemsLab {
  ok: boolean;
  search: String;
  itemsLab: IItemLab[];
}
