export interface IRuta {
  _id: string;
  codRuta: string;
  nombreRuta: string;
  nombreMostrar: string;
  descripcionRuta: string;
  urlRuta: string;
  iconoRuta: string;
  estado: string;
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
