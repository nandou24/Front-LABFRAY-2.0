import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { DocumentoConsultado, PrevisualizacionRegularizacionTemporalResponse, RegularizarTemporalHCExistenteRequest, RegularizarTemporalHCExistenteResponse } from '../../../../models/Gestion/previsualizacionRegularizacionTemporal.models';
import { AuthService } from '../../../auth/auth.service';
import { environment } from '../../../../../environments/environment';
import {
  EstadoProgramacion,
  IListarProgramacionesQuery,
  IProgramacionPostDTO,
  IProgramacionEmpresa,
  IGetProgramaciones,
  IGetProgramacionById,
  IRegularizarDocumentoProgramacionResponse,
  IRegularizarDocumentoProgramacionRequest,
  ICorregirDocumentoProgramacionRequest,
  IHistorialDocumentoProgramacionResponse,
  IVerificacionDocumentoHC,
  TipoDocumentoProgramacion,
  IFilaValidacionImportacion,
  IValidacionMasivaProgramacionesResponse,
  IFilaRegistroImportacion,
  IRespuestaRegistroImportacion,
} from '../../../../models/Gestion/programacionEmpresa.models';

@Injectable({
  providedIn: 'root',
})
export class ProgramacionEmpresaService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly apiUrl = `${environment.baseUrl}/api/programacionPacienteEmpresa`;

  public crearProgramacionEmpresa(
    body: IProgramacionEmpresa,
  ): Observable<IProgramacionPostDTO> {
    return this._http.post<IProgramacionPostDTO>(this.apiUrl, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  // Alias para mantener consistencia semantica en llamadas de registro
  public registrarProgramacion(
    body: IProgramacionEmpresa,
  ): Observable<IProgramacionPostDTO> {
    return this.crearProgramacionEmpresa(body);
  }

  public getLastProgramaciones(
    cantidad: number,
  ): Observable<IProgramacionEmpresa[]> {
    return this.listarProgramaciones();
  }

  public getProgramacion(
    terminoBusqueda: string,
  ): Observable<IProgramacionEmpresa[]> {
    return this.listarProgramaciones({ nroDoc: terminoBusqueda });
  }

  public listarProgramaciones(
    filtros?: IListarProgramacionesQuery,
  ): Observable<IProgramacionEmpresa[]> {
    let params = new HttpParams();

    if (filtros?.empresaId) {
      params = params.set('empresaId', filtros.empresaId);
    }

    if (filtros?.estadoProgramacion) {
      params = params.set('estadoProgramacion', filtros.estadoProgramacion);
    }

    if (filtros?.nroDoc) {
      params = params.set('nroDoc', filtros.nroDoc);
    }

    if (filtros?.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }

    if (filtros?.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    return this._http
      .get<IGetProgramaciones>(this.apiUrl, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.programaciones));
  }

  public getProgramacionById(id: string): Observable<IProgramacionEmpresa> {
    return this._http
      .get<IGetProgramacionById>(`${this.apiUrl}/${id}`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.programacion));
  }

  public actualizarProgramacion(
    body: IProgramacionEmpresa,
  ): Observable<IProgramacionPostDTO> {
    return this._http.put<IProgramacionPostDTO>(
      `${this.apiUrl}/${body._id}`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  public actualizarEstadoProgramacion(
    id: string,
    estadoProgramacion: EstadoProgramacion,
  ): Observable<IProgramacionPostDTO> {
    return this._http.put<IProgramacionPostDTO>(
      `${this.apiUrl}/${id}/estado`,
      { estadoProgramacion },
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }


  // ====== Coincidencias independientes por documento y por nombres ======
  consultarCoincidenciasVinculacion(id: string): Observable<{
    ok: boolean; vinculada: boolean;
    porDocumento: Array<{
      pacienteId: string; hc: string | null; tipoDoc: string | null; nroDoc: string | null;
      nombreCliente: string; apePatCliente: string; apeMatCliente: string;
      documentoExacto: boolean; nombresExactos: boolean; vinculacionPermitida: boolean; identificacionPendiente: boolean;
      tipoCoincidencia: string;
      fechaNacimiento?: string | null; sexoCliente?: string | null;
      fotoReferencia?: { programacionEmpresaId: string | null; solicitudAtencionId: string | null; fechaCaptura: string } | null;
    }>;
    porNombres: Array<{
      pacienteId: string; hc: string | null; tipoDoc: string | null; nroDoc: string | null;
      nombreCliente: string; apePatCliente: string; apeMatCliente: string;
      documentoExacto: boolean; nombresExactos: boolean; vinculacionPermitida: boolean; identificacionPendiente: boolean;
      tipoCoincidencia: string;
      fechaNacimiento?: string | null; sexoCliente?: string | null;
      fotoReferencia?: { programacionEmpresaId: string | null; solicitudAtencionId: string | null; fechaCaptura: string } | null;
    }>;
    masPorDocumento: boolean; masPorNombres: boolean;
  }> {
    return this._http.get<any>(`${this.apiUrl}/${id}/coincidencias-vinculacion`,
      { headers: this._auth.getAuthHeaders() });
  }

  vincularPacienteInicial(id:string, pacienteId:string, revision?: { motivoDecision?:string; confirmacionExpresa:boolean }):Observable<any> {
    return this._http.post<any>(`${this.apiUrl}/${id}/vincular-paciente`, {pacienteId, ...(revision ?? {})},
      {headers:this._auth.getAuthHeaders()});
  }

  registrarRevisionCoincidencia(id:string, datos:{ pacienteId:string; decision:'DISTINTO'|'PENDIENTE'; motivo?:string|null }):Observable<any> {
    return this._http.post<any>(`${this.apiUrl}/${id}/revisar-coincidencia`, datos,
      {headers:this._auth.getAuthHeaders()});
  }

  obtenerHistorialVinculaciones(id:string):Observable<{ok:boolean; codProgramacion?:string; historial:Array<{
    tipo:string; hcAnterior:string|null; hcNueva:string|null; fecha:string;
    usuario:string; nombreCompletoUsuario?:string|null; ejecutadoPor?:string;
    origenDocumento?:string; pacienteIdAnterior?:string|null; pacienteIdNuevo?:string|null;
    tipoResolucion?:string|null; motivoDecision?:string|null;
  }>; revisiones?:Array<{decision:'DISTINTO'|'PENDIENTE'; pacienteIdCandidato:string; hcCandidata:string|null; documentoCoincidente:boolean; motivo:string|null; fecha:string; ejecutadoPor:string; usuario:string; nombreCompletoUsuario?:string|null}>;
    estadosCandidatos?:Array<{pacienteId:string; hc:string|null; nombreCompleto:string; documentoCoincidente:boolean; estado:'SIN_REVISAR'|'PENDIENTE'|'PERSONA_DISTINTA'|'CONFLICTO_DOCUMENTAL'}>}> {
    return this._http.get<any>(`${this.apiUrl}/${id}/historial-vinculaciones`,
      {headers:this._auth.getAuthHeaders()});
  }

  // ====== Regularizar documento del paciente vinculado ======
  public regularizarDocumento(
    id: string,
    datos: IRegularizarDocumentoProgramacionRequest,
  ): Observable<IRegularizarDocumentoProgramacionResponse> {
    return this._http.put<IRegularizarDocumentoProgramacionResponse>(
      `${this.apiUrl}/${id}/regularizar-documento`,
      datos,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Corregir identidad registrada previa autorización ======
  public corregirDocumento(
    id: string,
    datos: ICorregirDocumentoProgramacionRequest,
  ): Observable<IRegularizarDocumentoProgramacionResponse> {
    return this._http.put<IRegularizarDocumentoProgramacionResponse>(
      `${this.apiUrl}/${id}/corregir-documento`, datos,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Verificar coincidencias antes de guardar ======
  public verificarDocumento(
    id: string,
    datos: { tipoDoc: TipoDocumentoProgramacion; nroDoc: string },
  ): Observable<IVerificacionDocumentoHC> {
    return this._http.post<IVerificacionDocumentoHC>(
      `${this.apiUrl}/${id}/verificar-documento`, datos,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Historial de cambios de documento ======
  public historialDocumentos(id: string): Observable<IHistorialDocumentoProgramacionResponse> {
    return this._http.get<IHistorialDocumentoProgramacionResponse>(
      `${this.apiUrl}/${id}/historial-documentos`,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Validar lote contra maestros sin registrar ======
  public validarImportacionMasiva(
    filas: IFilaValidacionImportacion[],
  ): Observable<IValidacionMasivaProgramacionesResponse> {
    return this._http.post<IValidacionMasivaProgramacionesResponse>(
      `${this.apiUrl}/validar-importacion`,
      { filas },
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Registrar un lote atómico e identificable ======
  public registrarImportacionMasiva(
    importacionId: string,
    filas: IFilaRegistroImportacion[],
  ): Observable<IRespuestaRegistroImportacion> {
    return this._http.post<IRespuestaRegistroImportacion>(
      `${this.apiUrl}/registrar-importacion`,
      { importacionId, filas },
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Verificar documento temporal sin registrar cambios ======
  public previsualizarRegularizacionTemporal(
    id: string,
    documento: DocumentoConsultado,
  ): Observable<PrevisualizacionRegularizacionTemporalResponse> {
    return this._http.post<PrevisualizacionRegularizacionTemporalResponse>(
      `${this.apiUrl}/${id}/previsualizar-regularizacion`,
      documento,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== B.2.2A Regularizar identidad con HC existente ======
  public regularizarTemporalHCExistente(
    id: string,
    datos: RegularizarTemporalHCExistenteRequest,
  ): Observable<RegularizarTemporalHCExistenteResponse> {
    return this._http.post<RegularizarTemporalHCExistenteResponse>(
      `${this.apiUrl}/${id}/regularizar-hc-existente`,
      datos,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  public iniciarAtencionProgramacion(
    id: string,
    confirmacion?: { confirmarNuevaHC: boolean; motivoNuevaHC: string },
  ): Observable<any> {
    return this._http.post<any>(
      `${this.apiUrl}/${id}/iniciar-atencion`,
      confirmacion ?? {},
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }
}
