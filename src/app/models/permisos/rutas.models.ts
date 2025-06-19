export interface IRuta {
    
    codRuta: string,
    nombreRuta: string,
    descripcionRuta: string,
    urlRuta: string,
    estado: string
}

export interface IRutaPostDTO {
    ok: boolean;
    msg?: string;
    errors?: string;
}

export interface IGetLastRutas {
    ok: boolean;
    search: String;
    rutas: IRuta[];
}
