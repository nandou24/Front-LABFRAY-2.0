import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';

type EstadoVerificacion = 'VIGENTE' | 'REEMPLAZADO' | 'ANULADO' | 'REVOCADO';

interface IRespuestaVerificacion {
  ok: boolean;
  codigoInforme: string;
  estado: EstadoVerificacion;
  vigente: boolean;
  codSolicitud: string;
  codigoLaboratorio: string;
  tipoInforme: 'PARCIAL' | 'FINAL';
  cantidadPruebas: number;
  fechaRegistro: string;
  integridadPdfVerificada: boolean;
}

@Component({
  selector: 'app-verificacion-informe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verificacion-informe.component.html',
  styleUrl: './verificacion-informe.component.scss',
})
export class VerificacionInformeComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  cargando = true;
  informe: IRespuestaVerificacion | null = null;
  error: string | null = null;

  ngOnInit(): void {
    this.title.setTitle('Verificación de informe | LABFRAY');
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow, noarchive' });
    const fragmento = this.route.snapshot.fragment || '';
    const token = new URLSearchParams(fragmento).get('t') || '';

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      this.error = 'El código de verificación no es válido.';
      this.cargando = false;
      return;
    }

    // ====== La consulta pública nunca requiere iniciar sesión ======
    this.http.get<IRespuestaVerificacion>(
      `${environment.baseUrl}/api/resultadoLaboratorio/entrega/verificar-informe/${encodeURIComponent(token)}`,
    ).pipe(finalize(() => this.cargando = false)).subscribe({
      next: (resultado) => {
        this.informe = resultado;
      },
      error: (err) => {
        this.error = err?.status === 404
          ? 'No se encontró un informe correspondiente a este código.'
          : 'No fue posible consultar la autenticidad. Inténtalo nuevamente.';
      },
    });
  }

  get estadoTexto(): string {
    const estado = this.informe?.estado;
    if (estado === 'VIGENTE') return 'Informe vigente';
    if (estado === 'ANULADO') return 'Informe anulado';
    if (estado === 'REEMPLAZADO') return 'Informe reemplazado';
    if (estado === 'REVOCADO') return 'Verificación revocada';
    return 'Estado no disponible';
  }
}
