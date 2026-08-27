import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ArchivoPacienteService {
  private readonly _http = inject(HttpClient);

  private readonly _auth = inject(AuthService);

  private readonly apiUrl = `${environment.baseUrl}/api/archivoPaciente`;

  // ==========================================
  // SUBIR / ACTUALIZAR FOTO DE PERFIL
  // ==========================================

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
