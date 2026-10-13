import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { IBandejaEntregaResponse } from '../../../models/Gestion/entregaResultadoLaboratorio.models';

export interface IEstadoAlertaCriticaResultados {
  totalPruebasVencidas: number;
  totalSolicitudes: number;
  totalPacientes: number;
  fechaVencimientoMasAntigua: string | null;
  ultimaVerificacion: Date | null;
}

const ESTADO_INICIAL: IEstadoAlertaCriticaResultados = {
  totalPruebasVencidas: 0,
  totalSolicitudes: 0,
  totalPacientes: 0,
  fechaVencimientoMasAntigua: null,
  ultimaVerificacion: null,
};

@Injectable({ providedIn: 'root' })
export class AlertasCriticasResultadosService {
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly _apiUrl = `${environment.baseUrl}/api/resultadoLaboratorio`;
  private readonly _estado = new BehaviorSubject<IEstadoAlertaCriticaResultados>(
    ESTADO_INICIAL,
  );

  readonly estado$ = this._estado.asObservable();

  private consultaEnCurso = false;
  private ultimaConsultaMs = 0;
  private readonly ventanaDuplicadaMs = 60_000;

  reiniciar(): void {
    this._estado.next(ESTADO_INICIAL);
    this.ultimaConsultaMs = 0;
  }

  // ====== Consultar deuda crítica vigente ======
  refrescar(forzar = true): void {
    const ahora = Date.now();

    if (this.consultaEnCurso) {
      return;
    }

    if (!forzar && ahora - this.ultimaConsultaMs < this.ventanaDuplicadaMs) {
      return;
    }

    this.consultaEnCurso = true;
    this.ultimaConsultaMs = ahora;

    this._http
      .get<IBandejaEntregaResponse>(`${this._apiUrl}/alertas-vencidas`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(finalize(() => (this.consultaEnCurso = false)))
      .subscribe({
        next: (response) => {
          const filas = response.bandeja ?? [];
          const fechasVencidas: number[] = [];
          let totalPruebasVencidas = 0;
          const pacientes = new Set<string>();

          for (const fila of filas) {
            const clavePaciente =
              fila.paciente?.pacienteId ||
              fila.paciente?.documento ||
              fila.paciente?.hc ||
              fila.solicitudAtencionId;

            pacientes.add(String(clavePaciente));

            for (const prueba of fila.pruebas ?? []) {
              if (prueba.estadoPlazo !== 'VENCIDO') {
                continue;
              }

              if (['LIBERADO', 'ANULADO'].includes(prueba.estadoResultado)) {
                continue;
              }

              totalPruebasVencidas += 1;

              if (prueba.fechaEstimada) {
                const tiempo = new Date(prueba.fechaEstimada).getTime();
                if (Number.isFinite(tiempo)) {
                  fechasVencidas.push(tiempo);
                }
              }
            }
          }

          const fechaMasAntiguaMs = fechasVencidas.length
            ? Math.min(...fechasVencidas)
            : null;

          this._estado.next({
            totalPruebasVencidas,
            totalSolicitudes: filas.length,
            totalPacientes: pacientes.size,
            fechaVencimientoMasAntigua:
              fechaMasAntiguaMs !== null
                ? new Date(fechaMasAntiguaMs).toISOString()
                : null,
            ultimaVerificacion: new Date(),
          });
        },
        error: (error) => {
          console.error('No se pudo actualizar la alerta crítica de resultados:', error);
        },
      });
  }

  // ====== Evitar consultas duplicadas al recuperar foco ======
  refrescarSiCorresponde(): void {
    this.refrescar(false);
  }
}
