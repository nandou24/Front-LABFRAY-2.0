import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SolicitudAtencionService } from '../../../services/gestion/solicitudAtencion/solicitud-atencion.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ISolicitudAtencion } from '../../../models/Gestion/solicitudAtencion.models';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { HcPdfService } from '../../../services/utilitarios/pdf/historiaClinica/hc-pdf.service';
import { DialogPdfSolicitudAtencionComponent } from './dialogs/dialog-pdf-solicitud-atencion/dialog-pdf-solicitud-atencion.component';

@Component({
  selector: 'app-solicitud-atencion',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatPaginator,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  templateUrl: './solicitud-atencion.component.html',
  styleUrl: './solicitud-atencion.component.scss',
})
export class SolicitudAtencionComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _solicitudService = inject(SolicitudAtencionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private _pdfHCService = inject(HcPdfService);

  ngOnInit(): void {
    this.buscarSolicitudes();
    this.dataSourceSolicitud.paginator = this.paginator;
    this.dataSourceSolicitud.sort = this.sort;
    this._adapter.setLocale('es-PE'); // Establecer el locale para el adaptador de fecha
  }

  solicitudForm: FormGroup = this._fb.group({
    cotizacionId: ['', Validators.required],
    tipo: ['', Validators.required],
    servicios: this._fb.array([], Validators.required),
    hc: ['', Validators.required],
    tipoDocumento: ['', Validators.required],
    nroDocumento: ['', [Validators.required, Validators.minLength(6)]],
    nombreCompleto: ['', Validators.required],
    codUsuarioEmisor: ['', Validators.required],
    usuarioEmisor: ['', Validators.required],
  });

  get servicios(): FormArray {
    return this.solicitudForm.get('servicios') as FormArray;
  }

  myGroupBusqueda = new FormGroup({
    terminoBusqueda: new FormControl(),
    fechaInicio: new FormControl(new Date()),
    fechaFin: new FormControl(new Date()),
    filtroBusqueda: new FormControl(),
  });

  terminoBusqueda = new FormControl('');
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  //Tabla roles
  columnasTablaSolicitud: string[] = [
    'cotizacionId',
    'codigoPago',
    'codigoSolicitud',
    'fechaEmision',
    'nombreCompleto',
    'tipo',
    'estado',
    'acciones',
  ];
  columnasTablaSolicitudWithExpand = [...this.columnasTablaSolicitud, 'expand'];
  dataSourceSolicitud = new MatTableDataSource<ISolicitudAtencion>();
  expandedSolicitud: ISolicitudAtencion | null = null;

  /** Checks whether an element is expanded. */
  isExpandedSolicitud(element: ISolicitudAtencion) {
    return this.expandedSolicitud === element;
  }

  /** Toggles the expanded state of an element. */
  toggleSolicitud(element: ISolicitudAtencion) {
    this.expandedSolicitud = this.isExpandedSolicitud(element) ? null : element;
  }

  filtrar(event: Event) {
    const termino = (event.target as HTMLInputElement).value;
    this.dataSourceSolicitud.filter = termino.trim().toLowerCase();
  }

  imprimirSolicitud(solicitud: any) {
    // Implementar generación de PDF
    const pdfSrc = this._pdfHCService.generarHistoriaClinicaPDF(solicitud);

    this.dialog.open(DialogPdfSolicitudAtencionComponent, {
      data: { pdfSrc, solicitudData: solicitud },
      width: '70vw',
      height: '95vh',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
    });
  }

  buscarSolicitudes() {
    const termino = this.myGroupBusqueda.get('terminoBusqueda')?.value || '';
    const fechaInicioControl =
      this.myGroupBusqueda.get('fechaInicio')?.value || new Date();
    const fechaFinControl =
      this.myGroupBusqueda.get('fechaFin')?.value || new Date();

    console.log('Fecha Inicio:', fechaInicioControl);
    console.log('Fecha Fin:', fechaFinControl);

    const inicio = new Date(fechaInicioControl);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFinControl);
    fin.setHours(23, 59, 59, 999);

    console.log('Inicio:', inicio);
    console.log('Fin:', fin);

    console.log('Término despues:', fechaInicioControl, fechaFinControl);

    this._solicitudService
      .getAllByDateRange(inicio.toISOString(), fin.toISOString(), termino)
      .subscribe({
        next: (solicitudes) => {
          this.dataSourceSolicitud.data = solicitudes;
          console.log('Solicitudes encontradas:', solicitudes);
          this.snackBar.open(
            `Se encontraron ${solicitudes.length} solicitudes`,
            'Cerrar',
            { duration: 3000 },
          );
        },
        error: (err) => {
          console.error('Error al buscar solicitudes:', err);
          this.snackBar.open('Error al buscar solicitudes', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }
}
