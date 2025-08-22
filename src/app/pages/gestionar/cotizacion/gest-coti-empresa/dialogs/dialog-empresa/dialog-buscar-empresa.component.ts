import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';

import { MatPaginator } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';
import { IEmpresa } from '../../../../../../models/Mantenimiento/empresa.models';

@Component({
  selector: 'app-dialog-buscar-empresa',
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginator,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialog-buscar-empresa.component.html',
  styleUrl: './dialog-buscar-empresa.component.scss',
})
export class DialogBuscarEmpresaComponent {
  cargando = false;
  terminoBusquedaEmpresa = new FormControl();

  constructor(
    public dialogRef: MatDialogRef<DialogBuscarEmpresaComponent>,
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
