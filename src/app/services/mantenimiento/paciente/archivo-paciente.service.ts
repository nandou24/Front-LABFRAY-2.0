import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

export interface IFotoPerfilPacienteResponse {
  ok: boolean;
  disponible: boolean;
  urlTemporal: string | null;
  fechaCaptura?: string | null;
  motivo?: 'SIN_EVALUACION_VINCULADA' | 'SIN_FOTOGRAFIA';
}

// ====== Referencia compartida entre pantallas ======
export interface IReferenciaFotoEvaluacion {
  pacienteId?: string | null;
  hc?: string | null;
  programacionEmpresaId?: string | null;
  solicitudAtencionId?: string | null;
}

export interface IFotoEvaluacionCacheada {
  disponible: boolean;
  imagen: Blob | null;
}

type EntradaFoto = {
  vence: number;
  valor?: IFotoEvaluacionCacheada;
  peticion?: Observable<IFotoEvaluacionCacheada>;
};

@Injectable({
  providedIn: 'root',
})
export class ArchivoPacienteService {
  private readonly _http = inject(HttpClient);

  private readonly _auth = inject(AuthService);

  private readonly apiUrl = `${environment.baseUrl}/api/archivoPaciente`;

  // ====== Caché temporal de fotografías de evaluación, solo en memoria ======
  private readonly fotosCache = new Map<string, EntradaFoto>();
  private tokenCache = '';
  private readonly ttlFotoMs = 10 * 60 * 1000;
  private readonly ttlSinFotoMs = 45 * 1000;
  private readonly limiteFotos = 100;
  private readonly limiteBytes = 100 * 1024 * 1024;

  private claveFoto(datos: IReferenciaFotoEvaluacion): string {
    // ====== La programación identifica una evaluación entre módulos ======
    if (datos.programacionEmpresaId) return `PE:${datos.programacionEmpresaId}`;
    if (datos.solicitudAtencionId) return `SOL:${datos.solicitudAtencionId}`;
    return '';
  }

  private asegurarSesion(): void {
    // ====== Una nueva sesión no reutiliza imágenes de otro operador ======
    const token = this._auth.getToken();
    if (this.tokenCache !== token) {
      this.fotosCache.clear();
      this.tokenCache = token;
    }
  }

  private limitarCache(): void {
    const ahora = Date.now();
    for (const [clave, entrada] of this.fotosCache) {
      if (entrada.valor && entrada.vence <= ahora) this.fotosCache.delete(clave);
    }
    let elementos = 0;
    let bytes = 0;
    for (const entrada of this.fotosCache.values()) {
      if (!entrada.valor) continue;
      elementos++;
      bytes += entrada.valor.imagen?.size ?? 0;
    }
    for (const [clave, entrada] of this.fotosCache) {
      if (elementos <= this.limiteFotos && bytes <= this.limiteBytes) break;
      if (!entrada.valor) continue;
      elementos--;
      bytes -= entrada.valor.imagen?.size ?? 0;
      this.fotosCache.delete(clave);
    }
  }

  // ====== Una sola petición por evaluación, aunque se abran varias pantallas ======
  obtenerFotoEvaluacionCacheada(datos: IReferenciaFotoEvaluacion): Observable<IFotoEvaluacionCacheada> {
    this.asegurarSesion();
    const clave = this.claveFoto(datos);
    if (!clave) return of({ disponible: false, imagen: null });

    const existente = this.fotosCache.get(clave);
    if (existente?.valor && existente.vence > Date.now()) {
      // ====== Actualizar orden de uso (LRU) ======
      this.fotosCache.delete(clave);
      this.fotosCache.set(clave, existente);
      return of(existente.valor);
    }
    if (existente?.peticion) return existente.peticion;
    if (existente) this.fotosCache.delete(clave);

    const entrada: EntradaFoto = { vence: 0 };
    this.fotosCache.set(clave, entrada);
    const peticion = this.obtenerFotoIdentificacion(datos).pipe(
      switchMap(info => info.disponible
        ? this.obtenerImagenEvaluacion(datos).pipe(
            map(imagen => ({ disponible: true, imagen }) as IFotoEvaluacionCacheada),
          )
        : of({ disponible: false, imagen: null } as IFotoEvaluacionCacheada)),
      tap(valor => {
        if (this.fotosCache.get(clave) !== entrada) return;
        entrada.valor = valor;
        entrada.peticion = undefined;
        entrada.vence = Date.now() + (valor.disponible ? this.ttlFotoMs : this.ttlSinFotoMs);
        this.limitarCache();
      }),
      catchError(error => {
        // ====== Los errores de red no deben quedar en caché ======
        if (this.fotosCache.get(clave) === entrada) this.fotosCache.delete(clave);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    entrada.peticion = peticion;
    return peticion;
  }

  invalidarFotoEvaluacion(datos?: IReferenciaFotoEvaluacion): void {
    this.asegurarSesion();
    if (!datos) { this.fotosCache.clear(); return; }
    const clave = this.claveFoto(datos);
    if (clave) this.fotosCache.delete(clave);
  }



  // ==========================================
  // SUBIR / ACTUALIZAR FOTO DE PERFIL
  // ==========================================

  // ====== Fotografía identificativa por HC o paciente ======
  obtenerFotoIdentificacion(datos: {
    pacienteId?: string | null;
    hc?: string | null;
    programacionEmpresaId?: string | null;
    solicitudAtencionId?: string | null;
  }): Observable<IFotoPerfilPacienteResponse> {
    const params: Record<string, string> = {};
    if (datos.pacienteId) params['pacienteId'] = datos.pacienteId;
    if (datos.hc) params['hc'] = datos.hc;
    if (datos.programacionEmpresaId) params['programacionEmpresaId'] = datos.programacionEmpresaId;
    if (datos.solicitudAtencionId) params['solicitudAtencionId'] = datos.solicitudAtencionId;

    return this._http.get<IFotoPerfilPacienteResponse>(`${this.apiUrl}/foto-identificacion`, {
      params,
      headers: this._auth.getAuthHeaders(),
    });
  }

  // ====== Fotografía asociada a evaluación, programación y solicitudes ======
  obtenerImagenEvaluacion(datos: {
    pacienteId?: string | null;
    hc?: string | null;
    programacionEmpresaId?: string | null;
    solicitudAtencionId?: string | null;
  }): Observable<Blob> {
    const params: Record<string, string> = {};
    if (datos.pacienteId) params['pacienteId'] = datos.pacienteId;
    if (datos.hc) params['hc'] = datos.hc;
    if (datos.programacionEmpresaId) params['programacionEmpresaId'] = datos.programacionEmpresaId;
    if (datos.solicitudAtencionId) params['solicitudAtencionId'] = datos.solicitudAtencionId;
    return this._http.get(`${this.apiUrl}/foto-evaluacion/imagen`, {
      params,
      responseType: 'blob',
      headers: this._auth.getAuthHeaders(),
    });
  }

  subirFotoEvaluacion(pacienteId: string, archivo: Blob, programacionEmpresaId: string): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo, 'foto-evaluacion.jpg');
    formData.append('programacionEmpresaId', programacionEmpresaId);
    return this._http.post<any>(`${this.apiUrl}/${pacienteId}/foto-evaluacion`, formData, {
      headers: this._auth.getAuthHeaders(),
    }).pipe(tap(() => this.invalidarFotoEvaluacion()));
  }

  // ====== Consultar foto de perfil activa ======
  obtenerFotoPerfil(pacienteId: string): Observable<IFotoPerfilPacienteResponse> {
    return this._http.get<IFotoPerfilPacienteResponse>(
      `${this.apiUrl}/${pacienteId}/foto-perfil`,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  subirFotoPerfil(
    pacienteId: string,
    archivo: Blob,
    programacionEmpresaId?: string,
  ): Observable<any> {
    const formData = new FormData();

    // ==========================================
    // ARCHIVO
    // ==========================================

    formData.append('archivo', archivo, 'foto-paciente.jpg');

    // ==========================================
    // PROGRAMACIÓN OPCIONAL
    // ==========================================

    if (programacionEmpresaId) {
      formData.append('programacionEmpresaId', programacionEmpresaId);
    }

    // ==========================================
    // PETICIÓN
    // ==========================================

    return this._http.post<any>(
      `${this.apiUrl}/${pacienteId}/foto-perfil`,
      formData,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }
}
