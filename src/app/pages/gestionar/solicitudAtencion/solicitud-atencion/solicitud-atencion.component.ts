import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SolicitudAtencionService } from '../../../../services/gestion/solicitudAtencion/solicitud-atencion.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ISolicitudAtencion } from '../../../../models/solicitudAtencion.models';
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
  templateUrl: './solicitud-atencion.component.html',
  styleUrl: './solicitud-atencion.component.scss',
})
export class SolicitudAtencionComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _solicitudService = inject(SolicitudAtencionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  solicitudForm: FormGroup = this._fb.group({
    cotizacionId: ['', Validators.required],
    tipo: ['', Validators.required],
    servicios: this._fb.array([], Validators.required),
    hc: ['', Validators.required],
    tipoDocumento: ['', Validators.required],
    nroDocumento: ['', [Validators.required, Validators.minLength(6)]],
    pacienteNombre: ['', Validators.required],
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
    'codigoSolicitud',
    'codigoCotizacion',
    'codigoPago',
    'fechaEmision',
    'pacienteNombre',
    'tipo',
    'estado',
    'acciones',
  ];
  dataSourceSolicitud = new MatTableDataSource<ISolicitudAtencion>();

  cargarSolicitudes(fechaInicio?: string, fechaFin?: string) {
    const hoy = new Date();

    if (!fechaInicio || !fechaFin) {
      fechaInicio = new Date(hoy.setHours(0, 0, 0, 0)).toISOString();
      fechaFin = new Date(hoy.setHours(23, 59, 59, 999)).toISOString();
    }
    this._solicitudService.getAllByDateRange(fechaInicio, fechaFin).subscribe({
      next: (solicitudes) => {
        console.log('Solicitudes cargadas:', solicitudes);
        this.dataSourceSolicitud.data = solicitudes;
        this.dataSourceSolicitud.paginator = this.paginator;
        this.dataSourceSolicitud.sort = this.sort;
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  filtrar(event: Event) {
    const termino = (event.target as HTMLInputElement).value;
    this.dataSourceSolicitud.filter = termino.trim().toLowerCase();
  }

  actualizarEstadoSolicitud(any: any) {}

  imprimirSolicitud(any: any) {}
}
