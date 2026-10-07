import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { IFilaEntrega } from '../../../models/Gestion/entregaResultadoLaboratorio.models';
import { EntregaResultadosService } from '../../../services/gestion/entregaResultados/entrega-resultados.service';
import { DialogEntregaResultadosComponent } from './dialogs/dialog-entrega-resultados/dialog-entrega-resultados.component';

@Component({
  selector: 'app-entrega-resultados',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
  templateUrl: './entrega-resultados.component.html',
  styleUrl: './entrega-resultados.component.scss',
})
export class EntregaResultadosComponent implements OnInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _service = inject(EntregaResultadosService);
  private readonly _dialog = inject(MatDialog);
  private readonly _snack = inject(MatSnackBar);

  readonly hoy = this.formatearFecha(new Date());
  readonly formBusqueda = this._fb.nonNullable.group({
    fechaInicio: this.hoy,
    fechaFin: this.hoy,
    terminoBusqueda: '',
  });

  bandeja: IFilaEntrega[] = [];
  cargando = false;
  tabActivo = 0;
  pagina = 0;
  tamanoPagina = 25;

  ngOnInit(): void { this.buscar(); }

  private formatearFecha(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  get filtradas(): IFilaEntrega[] {
    const origen = this.tabActivo === 0 ? 'PARTICULAR' : 'EMPRESA';
    return this.bandeja.filter((fila) => fila.origenAtencion === origen);
  }

  get visibles(): IFilaEntrega[] {
    const desde = this.pagina * this.tamanoPagina;
    return this.filtradas.slice(desde, desde + this.tamanoPagina);
  }

  totalOrigen(origen: 'PARTICULAR' | 'EMPRESA'): number {
    return this.bandeja.filter((fila) => fila.origenAtencion === origen).length;
  }

  cambiarTab(index: number): void { this.tabActivo = index; this.pagina = 0; }

  cambiarPagina(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanoPagina = event.pageSize;
  }

  buscar(): void {
    if (this.cargando) return;
    const valor = this.formBusqueda.getRawValue();
    if (!valor.fechaInicio || !valor.fechaFin || valor.fechaInicio > valor.fechaFin) {
      this._snack.open('Verifique el rango de fechas', 'Cerrar', { duration: 3500 });
      return;
    }
    this.cargando = true;
    this._service.obtenerBandeja(valor.fechaInicio, valor.fechaFin, valor.terminoBusqueda.trim())
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: (res) => { this.bandeja = res.bandeja || []; this.pagina = 0; },
        error: (err) => this._snack.open(err.error?.msg || 'No se pudo consultar entregas', 'Cerrar', { duration: 4500 }),
      });
  }

  hoyBuscar(): void {
    this.formBusqueda.patchValue({ fechaInicio: this.hoy, fechaFin: this.hoy, terminoBusqueda: '' });
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
}
