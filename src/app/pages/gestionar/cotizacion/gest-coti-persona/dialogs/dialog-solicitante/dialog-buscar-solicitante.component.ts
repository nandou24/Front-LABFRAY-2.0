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
import { IRefMedico } from '../../../../../../models/Mantenimiento/referenciaMedico.models';
import { ReferenciaMedicoService } from '../../../../../../services/mantenimiento/referencias/referencia-medico.service';

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
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dialog-buscar-solicitante.component.html',
  styleUrls: ['./dialog-buscar-solicitante.component.scss'],
})
export class DialogBuscarSolicitanteComponent implements OnInit {
  cargando = false;
  busquedaControl = new FormControl('');

  constructor(
    public dialogRef: MatDialogRef<DialogBuscarSolicitanteComponent>,
    private _refMedicoService: ReferenciaMedicoService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.busquedaControl.valueChanges.subscribe(() => this.buscarRefMedicos());
  }

  ngOnInit(): void {
    this.ultimosRefMedicos();
  }

  @ViewChild(MatTable) table!: MatTable<any>;

  //Tabla rrhh
  columnasTablaRefMedicos: string[] = [
    'nro',
    'nombreCompleto',
    'profesion',
    'colegiatura',
    'especialidad',
    'acciones',
  ];
  dataSourceRefMedicos = new MatTableDataSource<IRefMedico>();
  timeoutBusqueda: any;

  buscarRefMedicos() {
    this.cargando = true;
    clearTimeout(this.timeoutBusqueda);
    this.timeoutBusqueda = setTimeout(() => {
      const termino = this.busquedaControl.value?.trim() || '';
      if (termino.length >= 3) {
        this._refMedicoService
          .getRefMedico(termino)
          .subscribe((res: IRefMedico[]) => {
            this.dataSourceRefMedicos.data = res;
            this.cargando = false;
          });
      } else if (termino.length > 0) {
        this.dataSourceRefMedicos.data = [];
        this.cargando = false;
      } else {
        this.ultimosRefMedicos();
        this.cargando = false;
      }
    }, 200);
  }

  ultimosRefMedicos(): void {
    this._refMedicoService.getLastRefMedicosCotizacion().subscribe({
      next: (res: IRefMedico[]) => {
        this.dataSourceRefMedicos.data = res;
        console.log('Últimos solicitantes cargados:', res);
      },
      error: (err: any) => {
        this.dataSourceRefMedicos.data = [];
      },
    });
  }

  seleccionarSolicitante(paciente: any) {
    this.dialogRef.close(paciente);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
