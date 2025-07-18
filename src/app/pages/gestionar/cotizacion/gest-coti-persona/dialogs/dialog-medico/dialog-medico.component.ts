import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IPersonalSaludParaConsultas,
  IRecHumano,
} from '../../../../../../models/Mantenimiento/recursoHumano.models';
import { MatInputModule } from '@angular/material/input';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RecursoHumanoService } from '../../../../../../services/mantenimiento/recursoHumano/recurso-humano.service';

@Component({
  selector: 'app-dialog-medico',
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
  templateUrl: './dialog-medico.component.html',
  styleUrl: './dialog-medico.component.scss',
})
export class DialogMedicoComponent implements OnInit {
  cargando = false;
  terminoBusquedaPersonal = new FormControl('');

  medicoSeleccionado: string = '';

  ngOnInit(): void {
    this.obtenerYFiltrarMedicos();
  }

  dialogRef = inject(MatDialogRef<DialogMedicoComponent>);
  _recursoHumanoService = inject(RecursoHumanoService);
  data = inject<{
    profesionesAsociadas: {
      profesionId: string;
      especialidadId?: string;
    }[];
  }>(MAT_DIALOG_DATA);

  @ViewChild(MatTable) table!: MatTable<any>;

  //Tabla rrhh
  columnasTablaPacientes: string[] = [
    'nro',
    'colegiatura',
    'nombreCompleto',
    'acciones',
  ];
  dataSourcePersonal = new MatTableDataSource<IRecHumano>();

  obtenerYFiltrarMedicos(): void {
    this.cargando = true;

    let medicosObtenidos: IRecHumano[] = [];
    this._recursoHumanoService.getTodosPersonalSalud().subscribe({
      next: (medicos: IRecHumano[]) => {
        medicosObtenidos = medicos;
        console.log('Recursos humanos obtenidos:', medicosObtenidos);

        // Filtrar los médicos según las profesiones asociadas
        if (this.data.profesionesAsociadas.length > 0) {
          medicosObtenidos = medicosObtenidos.filter((medico) => {
            return this.data.profesionesAsociadas.some((profesion) => {
              return (
                medico.profesionesRecurso.some(
                  (p) => p._id === profesion.profesionId,
                ) &&
                (!profesion.especialidadId ||
                  medico.profesionesRecurso.some((p) =>
                    p.especialidades.some(
                      (e) => e._id === profesion.especialidadId,
                    ),
                  ))
              );
            });
          });
        }

        this.dataSourcePersonal.data = medicosObtenidos;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar médicos:', err);
        this.dataSourcePersonal.data = [];
        this.cargando = false;
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  seleccionar(personal: any): void {
    this.dialogRef.close(personal);
  }
}
