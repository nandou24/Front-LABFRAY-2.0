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
import { HojaTrabajoLabPdfService } from '../../../services/utilitarios/pdf/hojaTrabajo-Lab/hoja-trabajo-lab-pdf.service';
import { ServiciosService } from '../../../services/mantenimiento/servicios/servicios.service';

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
  private _servicioService = inject(ServiciosService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private _pdfConsultaMedicaService = inject(HcPdfService);
  private _pdfHojaTrabajoLabService = inject(HojaTrabajoLabPdfService);

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
    nombreCliente: ['', Validators.required],
    apePatCliente: ['', Validators.required],
    apeMatCliente: ['', Validators.required],
    hc: ['', Validators.required],
    tipoDoc: ['', Validators.required],
    nroDoc: ['', Validators.required],
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

  async imprimirSolicitud(solicitud: any) {
    console.log('Servicios:', solicitud.servicios);
    // Implementar generación de PDF

    if (!solicitud) {
      this.snackBar.open('No hay datos para generar el PDF', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    let pdfSrc;
    //let servicios;

    if (solicitud.tipo === 'Consulta') {
      pdfSrc =
        await this._pdfConsultaMedicaService.generarHojaConsultaMedicaPDF(
          solicitud,
        );
    } else if (solicitud.tipo === 'Laboratorio') {
      this._servicioService
        .getPruebasLaboratorioItems(solicitud.servicios)
        .subscribe({
          next: async (pruebasConItems) => {
            pdfSrc =
              await this._pdfHojaTrabajoLabService.generarHojaTrabajoLabPDF(
                solicitud,
                pruebasConItems,
              );
            this.opendialog(pdfSrc);
          },
          error: (err) => {
            console.error('Error al obtener pruebas de laboratorio:', err);
            this.snackBar.open(
              'Error al obtener pruebas de laboratorio',
              'Cerrar',
              {
                duration: 3000,
              },
            );
          },
        });
      return;
    }

    this.opendialog(pdfSrc);
  }

  opendialog(pdfSrc: any) {
    this.dialog.open(DialogPdfSolicitudAtencionComponent, {
      data: { pdfSrc: pdfSrc },
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

    //console.log('Fecha Inicio:', fechaInicioControl);
    // console.log('Fecha Fin:', fechaFinControl);

    const inicio = new Date(fechaInicioControl);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFinControl);
    fin.setHours(23, 59, 59, 999);

    // console.log('Inicio:', inicio);
    // console.log('Fin:', fin);

    // console.log('Término despues:', fechaInicioControl, fechaFinControl);

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
