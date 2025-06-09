//SERVICIO

export interface IServicio {
    codServicio: string,
    tipoServicio: string,
    nombreServicio: string,
    descripcionServicio: string,
    precioServicio: number,
    estadoServicio: string,
    favoritoServicio: boolean,
    examenesServicio: Array<any>[] 
}

export interface IServicioPostDTO {
    ok: boolean;
    msg?: string;
    errors?: string;
}

export interface IGetLastServicio {
    ok: boolean;
    search: String;
    servicios: IServicio[];
}

export interface IGetLastExamenes {
    ok: boolean;
    search: String;
    examenes: Array<any>[]
}