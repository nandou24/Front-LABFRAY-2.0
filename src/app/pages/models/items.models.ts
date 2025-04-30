export interface IItemLab {
    codItemLab: string,
    nombreItemLab: string,
    metodoItemLab: string,
    plantillaValores: string,
    unidadesRef: string,
    perteneceA: string,
    poseeValidacion: string,
    paramValidacion: Array<any>[]
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