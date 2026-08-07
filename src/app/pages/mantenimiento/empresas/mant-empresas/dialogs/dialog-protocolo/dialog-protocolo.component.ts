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
import { IEmpresa } from '../../../../../../models/Mantenimiento/empresa.models';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { CotizacionEmpresaService } from '../../../../../../services/gestion/cotizaciones/cotizacionEmpresa/cotizacion-empresa.service';
import { ICotizacionEmpresa } from '../../../../../../models/Gestion/cotizacionEmpresa.models';

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

  constructor(
    public dialogRef: MatDialogRef<DialogProtocoloComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.ultimasCotizaciones();
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorEmpresas') paginatorEmpresas!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceCotizaciones.paginator = this.paginatorEmpresas;
  }

  private _fb = inject(FormBuilder);

  public protocoloForm: FormGroup = this._fb.group({
    nroCoti: [''],
    estado: [true],
  });

  //Tabla rrhh
  columnasTablaCotizaciones: string[] = [
    'codCotizacion',
    'empresa',
    'fecha',
    'accion',];
  dataSourceCotizaciones = new MatTableDataSource<ICotizacionEmpresa>();

  ultimasCotizaciones(): void {
    console.log('RUC recibido en el diálogo:', this.data.ruc);
    if (!this.data.ruc) {
      console.error('No se proporcionó un RUC válido.');
      this.dataSourceCotizaciones.data = [];
      return;
    }else {
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

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  seleccionarCotizacion(cotizacion: ICotizacionEmpresa) {
    this.dialogRef.close(cotizacion);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
