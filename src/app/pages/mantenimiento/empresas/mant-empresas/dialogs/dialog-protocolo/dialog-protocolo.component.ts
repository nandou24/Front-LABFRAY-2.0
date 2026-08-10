import { CommonModule } from '@angular/common';
import { Component, inject, Inject, ViewChild } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { CotizacionEmpresaService } from '../../../../../../services/gestion/cotizaciones/cotizacionEmpresa/cotizacion-empresa.service';
import {
  ICotizacionEmpresa,
  IServicioCotizacionEmpresa,
} from '../../../../../../models/Gestion/cotizacionEmpresa.models';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IServicio } from '../../../../../../models/Mantenimiento/servicios.models';
import { ServiciosService } from '../../../../../../services/mantenimiento/servicios/servicios.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-protocolo',
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatPaginator,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialog-protocolo.component.html',
  styleUrl: './dialog-protocolo.component.scss',
})
export class DialogProtocoloComponent {
  cargando = false;
  terminoBusquedaEmpresa = new FormControl();
  private _cotizacionService = inject(CotizacionEmpresaService);
  private _servicioService = inject(ServiciosService);

  constructor(
    public dialogRef: MatDialogRef<DialogProtocoloComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.ultimasCotizaciones();
    this.ultimosServicios(0);
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorEmpresas') paginatorEmpresas!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceCotizaciones.paginator = this.paginatorEmpresas;
  }

  private _fb = inject(FormBuilder);

  public protocoloForm: FormGroup = this._fb.group({
    nombreProtocolo: [''],
    nroCoti: [''],
    estado: [true],
    tipo: ['manual'],
  });

  //Tabla rrhh
  columnasTablaCotizaciones: string[] = [
    'codCotizacion',
    'empresa',
    'fecha',
    'accion',
  ];

  columnasTablaServiciosSeleccionados: string[] = [
    'codigo',
    'nombre',
    'accion',
  ];
  dataSourceCotizaciones = new MatTableDataSource<ICotizacionEmpresa>();
  dataSourceServiciosSeleccionados = new MatTableDataSource<any>();

  ultimasCotizaciones(): void {
    console.log('RUC recibido en el diálogo:', this.data.ruc);
    if (!this.data.ruc) {
      console.error('No se proporcionó un RUC válido.');
      this.dataSourceCotizaciones.data = [];
      return;
    } else {
      this._cotizacionService.obtenerCotizacionPorRuc(this.data.ruc).subscribe({
        next: (res: ICotizacionEmpresa[]) => {
          this.dataSourceCotizaciones.data = res;
          console.log('Cotizaciones obtenidas:', res);
        },
        error: (err: any) => {
          this.dataSourceCotizaciones.data = [];
        },
      });
    }
  }

  removerServicio(servicio: IServicioCotizacionEmpresa) {
    this.dataSourceServiciosSeleccionados.data =
      this.dataSourceServiciosSeleccionados.data.filter(
        (servicioSeleccionado) =>
          servicioSeleccionado.codServicio !== servicio.codServicio,
      );
    this.table.renderRows();
  }

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  seleccionarCotizacion(cotizacion: ICotizacionEmpresa) {
    console.log('Cotización seleccionada:', cotizacion);
    // Necesito que el campo codCotizacion se muestre en el input nroCoti del formulario seguido de -V y el numero de version, por ejemplo: 12345-V1
    this.protocoloForm.patchValue({
      nroCoti: `${cotizacion.codCotizacion}-V${cotizacion.historial[cotizacion.historial.length - 1].version}`,
    });
    if (cotizacion.historial.length > 0) {
      const serviciosSeleccionados =
        cotizacion.historial[0].serviciosCotizacion.map(
          (servicio: IServicioCotizacionEmpresa) => ({ ...servicio }),
        );
      this.dataSourceServiciosSeleccionados.data = serviciosSeleccionados;
    }
  }

  cerrar() {
    this.dialogRef.close();
  }

  columnasServicios: string[] = ['codigo', 'nombre', 'tipo', 'accion'];
  dataSourceServicios = new MatTableDataSource<IServicio>();
  dataSourceServiciosFrecuentes = new MatTableDataSource<IServicio>();
  terminoBusquedaServicio = new FormControl('');
  timeoutBusqueda: any;

  buscarServicio() {
    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {
      const termino = this.terminoBusquedaServicio.value?.trim() || '';

      if (termino.length >= 2) {
        this._servicioService
          .getServicio(termino)
          .subscribe((res: IServicio[]) => {
            this.dataSourceServicios.data = res;
          });
      } else if (termino.length > 0) {
        this.dataSourceServicios.data = [];
      } else {
        this.ultimosServicios(0);
      }
    }, 200);
  }

  ultimosServicios(cantidad: number): void {
    this._servicioService.getLastServicio(cantidad).subscribe({
      next: (res: IServicio[]) => {
        this.dataSourceServicios.data = res;
      },
      error: (err: any) => {
        this.dataSourceServicios.data = [];
      },
    });
  }

  seleccionarServicio(servicio: IServicio) {

    const existe = this.dataSourceServiciosSeleccionados.data.some(
      (servicioSeleccionado) => servicioSeleccionado.codServicio === servicio.codServicio,
    );

    if (existe) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio ya agregado',
        text: 'Este servicio ya está en la lista de servicios seleccionados.',
      });
      return;
    }

    this.dataSourceServiciosSeleccionados.data = [
      ...this.dataSourceServiciosSeleccionados.data,
      servicio,
    ];
    this.table.renderRows();

    


  }

  crearProtocolo() {}

  cancelar() {
    this.dialogRef.close();
  }
}
