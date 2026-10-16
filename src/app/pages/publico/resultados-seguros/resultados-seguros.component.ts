import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, Meta, SafeResourceUrl, Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import {
  IAccesoPublicoResultadosResponse,
  IInformeEntregable,
} from '../../../models/Gestion/entregaResultadoLaboratorio.models';
import { EntregaResultadosService } from '../../../services/gestion/entregaResultados/entrega-resultados.service';
import { InformeLaboratorioPdfService } from '../../../services/utilitarios/pdf/laboratorio/informe-laboratorio-pdf.service';

@Component({
  selector: 'app-resultados-seguros',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './resultados-seguros.component.html',
  styleUrl: './resultados-seguros.component.scss',
})
export class ResultadosSegurosComponent implements OnInit, OnDestroy {
  private readonly _entrega = inject(EntregaResultadosService);
  private readonly _pdf = inject(InformeLaboratorioPdfService);
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _meta = inject(Meta);
  private readonly _title = inject(Title);

  cargando = true;
  generandoPdf = false;
  error = '';
  informe: IInformeEntregable | null = null;
  acceso: IAccesoPublicoResultadosResponse['acceso'] | null = null;
  pdfUrl: SafeResourceUrl | null = null;
  private pdfObjectUrl = '';
  private nombreArchivo = 'resultado-laboratorio.pdf';

  ngOnInit(): void {
    this._title.setTitle('Resultados de laboratorio · LAB FRAY');
    this._meta.updateTag({
      name: 'robots',
      content: 'noindex,nofollow,noarchive',
    });
    this._meta.updateTag({ name: 'referrer', content: 'no-referrer' });
    this.cargarInforme();
  }

  ngOnDestroy(): void {
    this.liberarPdf();
  }

  get nombrePaciente(): string {
    return this.informe?.solicitud?.paciente?.nombreCompleto || 'Paciente';
  }

  get codigoSolicitud(): string {
    return this.informe?.solicitud?.codSolicitud || '-';
  }

  get documentoPaciente(): string {
    return this.informe?.solicitud?.paciente?.documento || '-';
  }

  descargarPdf(): void {
    if (!this.pdfObjectUrl) return;

    const enlace = document.createElement('a');
    enlace.href = this.pdfObjectUrl;
    enlace.download = this.nombreArchivo;
    enlace.rel = 'noopener';
    enlace.click();
  }

  abrirPdf(): void {
    if (!this.pdfObjectUrl) return;
    window.open(this.pdfObjectUrl, '_blank', 'noopener,noreferrer');
  }

  private cargarInforme(): void {
    const token = this.obtenerToken();

    if (!token) {
      this.cargando = false;
      this.error = 'El enlace de resultados no es válido.';
      return;
    }

    this._entrega
      .resolverAccesoPublico(token)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (respuesta) => {
          this.informe = respuesta.informe;
          this.acceso = respuesta.acceso;
          void this.generarPdf();
        },
        error: (err) => {
          this.error =
            err?.error?.msg ||
            'No se pudo consultar el informe. Verifique el enlace recibido.';
        },
      });
  }

  private async generarPdf(): Promise<void> {
    if (!this.informe?.resultados?.length) {
      this.error = 'El informe no contiene resultados disponibles.';
      return;
    }

    this.generandoPdf = true;

    try {
      const archivo = await this._pdf.generarArchivoDigital(
        this.informe,
        this.informe.resultados,
      );

      this.liberarPdf();
      this.nombreArchivo = archivo.nombreArchivo;
      this.pdfObjectUrl = URL.createObjectURL(archivo.blob);
      this.pdfUrl = this._sanitizer.bypassSecurityTrustResourceUrl(
        this.pdfObjectUrl,
      );
    } catch {
      this.error = 'No se pudo generar la vista del informe.';
    } finally {
      this.generandoPdf = false;
    }
  }

  private obtenerToken(): string {
    const fragmento = String(window.location.hash || '').replace(/^#/, '');
    const params = new URLSearchParams(fragmento);
    return String(params.get('t') || '').trim();
  }

  private liberarPdf(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
    }

    this.pdfObjectUrl = '';
    this.pdfUrl = null;
  }
}
