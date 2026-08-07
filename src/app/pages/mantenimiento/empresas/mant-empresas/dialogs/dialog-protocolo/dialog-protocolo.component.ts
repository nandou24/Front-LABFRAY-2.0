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
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import { IEmpresa } from '../../../../../../models/Mantenimiento/empresa.models';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';

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

  constructor(
    public dialogRef: MatDialogRef<DialogProtocoloComponent>,
    private _empresaService: EmpresaService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.ultimosEmpresas(25);
    this.configurarBusquedaEmpresas();
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorEmpresas') paginatorEmpresas!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceEmpresas.paginator = this.paginatorEmpresas;
  }

  private _fb = inject(FormBuilder);

  public protocoloForm: FormGroup = this._fb.group({
    nroCoti: [''],
    estado: [true],
  });

  //Tabla rrhh
  columnasTablaEmpresas: string[] = ['nro', 'ruc', 'razonSocial', 'acciones'];
  dataSourceEmpresas = new MatTableDataSource<IEmpresa>();
  timeoutBusqueda: any;

  configurarBusquedaEmpresas(): void {
    this.terminoBusquedaEmpresa.valueChanges
      .pipe(
        filter((termino): termino is string => termino !== null),
        debounceTime(300),
        distinctUntilChanged(),
        tap((termino: string) => {
          termino = termino?.trim() || '';

          if (termino.length >= 3) {
            this._empresaService.getEmpresa(termino).subscribe({
              next: (res: IEmpresa[]) => {
                this.dataSourceEmpresas.data = res;
              },
              error: () => {
                this.dataSourceEmpresas.data = [];
              },
            });
          } else if (termino.length > 0) {
            this.dataSourceEmpresas.data = [];
          } else {
            this.ultimosEmpresas(25); // ← carga los pacientes recientes
          }
        }),
      )
      .subscribe();
  }

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  ultimosEmpresas(cantidad: number): void {
    console.log('Cargando últimos empresas de dialog');

    this._empresaService.getLastEmpresas(cantidad).subscribe({
      next: (res: IEmpresa[]) => {
        this.dataSourceEmpresas.data = res;
      },
      error: (err: any) => {
        this.dataSourceEmpresas.data = [];
      },
    });
  }

  seleccionarEmpresa(empresa: IEmpresa) {
    this.dialogRef.close(empresa);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
