export interface IUser {
    name: string;
    email: string;
    password: string;
    rol: number;
}

export interface IUserPostDTO {
  ok: boolean;
  msg?: string;
  errors?: string;
}

export interface ILoginResponse {
  ok: boolean;
  token?: string;
  msg?: string;
  user?: {
    nombreUsuario: string;
    rol: string;
    sedeAsignada: string;
    codRecHumano: string;
  };
}