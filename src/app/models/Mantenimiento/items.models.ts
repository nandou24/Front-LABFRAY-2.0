export interface IItemLab {
  _id?: string;
  codItemLab: string;
  nombreInforme: string;
  nombreHojaTrabajo: string;
  metodoItemLab: string;
  valoresHojaTrabajo: string;
  valoresInforme: string;
  unidadesRef: string;
  perteneceAPrueba: {
    _id: string;
    codPruebaLab: string;
    nombrePruebaLab: string;
  };
  ordenImpresion: number;
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
