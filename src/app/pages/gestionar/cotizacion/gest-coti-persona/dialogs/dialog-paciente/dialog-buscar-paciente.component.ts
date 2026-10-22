import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PacienteService } from '../../../../../../services/mantenimiento/paciente/paciente.service';
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
import { IPaciente } from '../../../../../../models/Mantenimiento/paciente.models';
import { MatPaginator } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';

@Component({
  selector: 'app-dialog-buscar-paciente',
  standalone: true,
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
  templateUrl: './dialog-buscar-paciente.component.html',
  styleUrls: ['./dialog-buscar-paciente.component.scss'],
})
export class DialogBuscarPacienteComponent implements OnInit {
  cargando = false;
  terminoBusquedaPaciente = new FormControl();

  constructor(
    public dialogRef: MatDialogRef<DialogBuscarPacienteComponent>,
    private _pacienteService: PacienteService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  // ====== El límite es configurable por el diálogo que abre la búsqueda ======
  get cantidadRecientes(): number {
    return this.data?.cantidadRecientes === 100 ? 100 : 25;
  }

  ngOnInit(): void {
    this.ultimosPacientes(this.cantidadRecientes);
    this.configurarBusquedaPacientes();
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorPacientes') paginatorPacientes!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourcePacientes.paginator = this.paginatorPacientes;
  }

  //Tabla rrhh
  columnasTablaPacientes: string[] = [
    'nro',
    'documento',
    'nombreCompleto',
    'acciones',
  ];
  dataSourcePacientes = new MatTableDataSource<IPaciente>();
  timeoutBusqueda: any;

  configurarBusquedaPacientes(): void {
    this.terminoBusquedaPaciente.valueChanges
      .pipe(
        filter((termino): termino is string => termino !== null),
        debounceTime(300),
        distinctUntilChanged(),
        tap((termino: string) => {
          termino = termino?.trim() || '';

          if (termino.length >= 3) {
            this._pacienteService.getPatientCotizacion(termino).subscribe({
              next: (res: IPaciente[]) => {
                this.dataSourcePacientes.data = res;
              },
              error: () => {
                this.dataSourcePacientes.data = [];
              },
            });
          } else if (termino.length > 0) {
            this.dataSourcePacientes.data = [];
          } else {
            this.ultimosPacientes(this.cantidadRecientes); // ====== Recuperar pacientes recientes ======
          }
        }),
      )
      .subscribe();
  }

  ultimosPacientes(cantidad: number): void {
    console.log('Cargando últimos pacientes de dialog');

    this._pacienteService.getLastPatientsCotizacion(cantidad).subscribe({
      next: (res: IPaciente[]) => {
        this.dataSourcePacientes.data = res;
      },
      error: (err: any) => {
        this.dataSourcePacientes.data = [];
      },
    });
  }

  seleccionarPaciente(paciente: any) {
    this.dialogRef.close(paciente);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
