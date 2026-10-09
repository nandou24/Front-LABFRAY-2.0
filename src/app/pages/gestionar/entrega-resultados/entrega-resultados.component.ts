import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { IFilaEntrega } from '../../../models/Gestion/entregaResultadoLaboratorio.models';
import { EntregaResultadosService } from '../../../services/gestion/entregaResultados/entrega-resultados.service';
import { EmpresaService } from '../../../services/mantenimiento/empresa/empresa.service';
import { InformeLaboratorioPdfService } from '../../../services/utilitarios/pdf/laboratorio/informe-laboratorio-pdf.service';
import { ZipArchivosService } from '../../../services/utilitarios/zip/zip-archivos.service';
import { DialogEntregaResultadosComponent } from './dialogs/dialog-entrega-resultados/dialog-entrega-resultados.component';

interface IEmpresaSelectorEntrega {
  empresaId: string;
  razonSocial: string;
  ruc: string;
}

@Component({
  selector: 'app-entrega-resultados',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'es-PE',
    },
  ],
  templateUrl: './entrega-resultados.component.html',
  styleUrl: './entrega-resultados.component.scss',
})
export class EntregaResultadosComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _service = inject(EntregaResultadosService);
  private readonly _empresaService = inject(EmpresaService);
  private readonly _pdfService = inject(InformeLaboratorioPdfService);
  private readonly _zipService = inject(ZipArchivosService);
  private readonly _dialog = inject(MatDialog);
  private readonly _snack = inject(MatSnackBar);

  readonly formBusqueda = this._fb.nonNullable.group({
    fechaInicio: new Date(),
    fechaFin: new Date(),
    terminoBusqueda: '',
    empresaId: '',
  });

  bandeja: IFilaEntrega[] = [];
  empresasCatalogo: IEmpresaSelectorEntrega[] = [];
  seleccionadasEmpresa = new Set<string>();
  cargando = false;
  cargandoEmpresas = false;
  modoSeleccionEmpresa = false;
  descargandoZip = false;
  progresoZip = '';
  tabActivo = 0;
  pagina = 0;
  tamanoPagina = 25;

  ngOnInit(): void {
    this._adapter.setLocale('es-PE');
    this.cargarEmpresas();
    this.buscar();
  }

  private formatearFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ====== Catálogo maestro de empresas ======
  private cargarEmpresas(): void {
    this.cargandoEmpresas = true;

    this._empresaService
      .getLastEmpresas(0)
      .pipe(finalize(() => (this.cargandoEmpresas = false)))
      .subscribe({
        next: (empresas) => {
          this.empresasCatalogo = empresas
            .map((empresa) => ({
              empresaId: String(empresa._id ?? ''),
              razonSocial: String(empresa.razonSocial ?? '').trim(),
              ruc: String(empresa.ruc ?? '').trim(),
            }))
            .filter((empresa) => empresa.empresaId && empresa.razonSocial)
            .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, 'es'));
        },
        error: () => {
          this.empresasCatalogo = [];
          this._snack.open(
            'No se pudo cargar el catálogo de empresas. La búsqueda general continúa disponible.',
            'Cerrar',
            { duration: 4500 },
          );
        },
      });
  }

  get filtradas(): IFilaEntrega[] {
    const origen = this.tabActivo === 0 ? 'PARTICULAR' : 'EMPRESA';
    return this.bandeja.filter((fila) => fila.origenAtencion === origen);
  }

  get visibles(): IFilaEntrega[] {
    const desde = this.pagina * this.tamanoPagina;
    return this.filtradas.slice(desde, desde + this.tamanoPagina);
  }

  get totalSeleccionadasEmpresa(): number {
    return this.seleccionadasEmpresa.size;
  }

  get totalSeleccionablesEmpresa(): number {
    return this.filtradas.filter(
      (fila) => fila.origenAtencion === 'EMPRESA' && fila.resumen.liberados > 0,
    ).length;
  }

  totalOrigen(origen: 'PARTICULAR' | 'EMPRESA'): number {
    return this.bandeja.filter((fila) => fila.origenAtencion === origen).length;
  }

  cambiarTab(index: number): void {
    this.tabActivo = index;
    this.pagina = 0;

    if (index !== 1) {
      this.cancelarSeleccionEmpresa();
    }
  }

  cambiarPagina(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanoPagina = event.pageSize;
  }

  buscar(): void {
    if (this.cargando || this.descargandoZip) return;

    const valor = this.formBusqueda.getRawValue();

    if (
      !valor.fechaInicio ||
      !valor.fechaFin ||
      valor.fechaInicio.getTime() > valor.fechaFin.getTime()
    ) {
      this._snack.open('Verifique el rango de fechas', 'Cerrar', { duration: 3500 });
      return;
    }

    this.cancelarSeleccionEmpresa();
    this.cargando = true;

    this._service
      .obtenerBandeja(
        this.formatearFecha(valor.fechaInicio),
        this.formatearFecha(valor.fechaFin),
        valor.terminoBusqueda.trim(),
        valor.empresaId,
      )
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          this.bandeja = res.bandeja || [];
          this.pagina = 0;

          if (valor.empresaId) {
            this.tabActivo = 1;
          }
        },
        error: (err) =>
          this._snack.open(
            err.error?.msg || 'No se pudo consultar entregas',
            'Cerrar',
            { duration: 4500 },
          ),
      });
  }

  hoyBuscar(): void {
    const hoy = new Date();
    this.formBusqueda.patchValue({
      fechaInicio: hoy,
      fechaFin: new Date(hoy),
      terminoBusqueda: '',
      empresaId: '',
    });
    this.buscar();
  }

  abrirInforme(fila: IFilaEntrega): void {
    this._dialog.open(DialogEntregaResultadosComponent, {
      width: '1100px',
      maxWidth: '96vw',
      maxHeight: '94vh',
      autoFocus: false,
      data: { solicitudAtencionId: fila.solicitudAtencionId },
    });
  }

  // ====== Activar selección para descarga múltiple ======
  activarSeleccionEmpresa(): void {
    if (this.totalSeleccionablesEmpresa === 0) {
      this._snack.open('No existen informes vigentes para seleccionar', 'Cerrar', {
        duration: 3500,
      });
      return;
    }

    this.modoSeleccionEmpresa = true;
    this.seleccionadasEmpresa.clear();
  }

  cancelarSeleccionEmpresa(): void {
    this.modoSeleccionEmpresa = false;
    this.seleccionadasEmpresa.clear();
  }

  estaSeleccionadaEmpresa(fila: IFilaEntrega): boolean {
    return this.seleccionadasEmpresa.has(fila.solicitudAtencionId);
  }

  esSeleccionableEmpresa(fila: IFilaEntrega): boolean {
    return fila.origenAtencion === 'EMPRESA' && fila.resumen.liberados > 0;
  }

  cambiarSeleccionEmpresa(fila: IFilaEntrega, seleccionada: boolean): void {
    if (!this.modoSeleccionEmpresa || !this.esSeleccionableEmpresa(fila)) {
      return;
    }

    if (seleccionada) {
      this.seleccionadasEmpresa.add(fila.solicitudAtencionId);
    } else {
      this.seleccionadasEmpresa.delete(fila.solicitudAtencionId);
    }
  }

  alternarSeleccionEmpresa(fila: IFilaEntrega): void {
    if (!this.modoSeleccionEmpresa || !this.esSeleccionableEmpresa(fila)) {
      return;
    }

    this.cambiarSeleccionEmpresa(fila, !this.estaSeleccionadaEmpresa(fila));
  }

  seleccionarDisponiblesEmpresa(): void {
    for (const fila of this.filtradas) {
      if (this.esSeleccionableEmpresa(fila)) {
        this.seleccionadasEmpresa.add(fila.solicitudAtencionId);
      }
    }
  }

  quitarSeleccionEmpresa(): void {
    this.seleccionadasEmpresa.clear();
  }

  // ====== Descargar informes individuales dentro de un ZIP ======
  async descargarZipSeleccionados(): Promise<void> {
    if (this.descargandoZip) return;

    const filas = this.bandeja.filter(
      (fila) =>
        this.esSeleccionableEmpresa(fila) &&
        this.seleccionadasEmpresa.has(fila.solicitudAtencionId),
    );

    if (!filas.length) {
      this._snack.open('Seleccione al menos un informe de empresa', 'Cerrar', {
        duration: 3500,
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: 'Descargar informes seleccionados',
      html:
        `Se generará un ZIP con <b>${filas.length}</b> PDF individual(es).<br>` +
        'Esta acción no registra una entrega al cliente.',
      showCancelButton: true,
      confirmButtonText: 'Generar ZIP',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.descargandoZip = true;
    const archivos: Array<{ nombre: string; blob: Blob }> = [];
    const fallidos: string[] = [];

    try {
      for (let i = 0; i < filas.length; i += 1) {
        const fila = filas[i];
        this.progresoZip = `Preparando informe ${i + 1} de ${filas.length}`;

        try {
          const informe = await firstValueFrom(
            this._service.obtenerInforme(fila.solicitudAtencionId),
          );

          if (!informe.resultados?.length) {
            fallidos.push(fila.codigoLaboratorio || fila.codSolicitud);
            continue;
          }

          const archivo = await this._pdfService.generarArchivoDigital(
            informe,
            informe.resultados,
          );
          archivos.push({ nombre: archivo.nombreArchivo, blob: archivo.blob });
        } catch {
          fallidos.push(fila.codigoLaboratorio || fila.codSolicitud);
        }
      }

      if (!archivos.length) {
        throw new Error('No se pudo preparar ningún informe seleccionado');
      }

      this.progresoZip = 'Generando archivo ZIP...';
      const zip = await this._zipService.crear(archivos);
      this.descargarBlob(zip, this.construirNombreZip(filas));

      const mensaje = fallidos.length
        ? `ZIP generado con ${archivos.length} informe(s). ${fallidos.length} no pudieron incluirse.`
        : `ZIP generado correctamente con ${archivos.length} informe(s).`;

      this._snack.open(mensaje, 'Cerrar', { duration: 5000 });
      this.cancelarSeleccionEmpresa();
    } catch (error) {
      this._snack.open(
        error instanceof Error
          ? error.message
          : 'No se pudo generar la descarga múltiple',
        'Cerrar',
        { duration: 4500 },
      );
    } finally {
      this.descargandoZip = false;
      this.progresoZip = '';
    }
  }

  private construirNombreZip(filas: IFilaEntrega[]): string {
    const empresaSeleccionada = this.obtenerEmpresaSeleccionada();
    const empresas = [
      ...new Set(
        filas
          .map((fila) => fila.empresa?.razonSocialEmpresa?.trim())
          .filter((valor): valor is string => Boolean(valor)),
      ),
    ];
    const nombreEmpresa =
      empresaSeleccionada?.razonSocial ||
      (empresas.length === 1 ? empresas[0] : 'EMPRESAS');
    const empresa = this.normalizarNombreArchivo(nombreEmpresa);
    const rango = this.formBusqueda.getRawValue();
    const desde = this.formatearFecha(rango.fechaInicio).replaceAll('-', '');
    const hasta = this.formatearFecha(rango.fechaFin).replaceAll('-', '');

    return `RESULTADOS_${empresa || 'EMPRESAS'}_${desde}_${hasta}.zip`;
  }

  private obtenerEmpresaSeleccionada(): IEmpresaSelectorEntrega | null {
    const empresaId = this.formBusqueda.controls.empresaId.value;
    return (
      this.empresasCatalogo.find((empresa) => empresa.empresaId === empresaId) ??
      null
    );
  }

  private normalizarNombreArchivo(valor: string): string {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80)
      .toUpperCase();
  }

  private descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
