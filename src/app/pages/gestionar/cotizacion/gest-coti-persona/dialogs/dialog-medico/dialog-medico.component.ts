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
  columnasTablaPacientes: string[] = ['nro', 'nombreCompleto', 'acciones'];
  dataSourcePersonal = new MatTableDataSource<IRecHumano>();

  obtenerYFiltrarMedicos(): void {
    this.cargando = true;
    const profesionesAsociadas = this.data.profesionesAsociadas;

    // Extraemos los IDs de especialidad del servicio asociado
    const especialidadesFiltro = profesionesAsociadas
      .map((p) => p.especialidadId)
      .filter((id): id is string => !!id);

    // Extraer profesiones SIN especialidad asociada
    const profesionesSinEspecialidad = profesionesAsociadas
      .filter((p) => !p.especialidadId)
      .map((p) => p.profesionId)
      .filter((id): id is string => !!id);

    //let personalAtiendeConsultas: IRecHumano[] = [];
    this._recursoHumanoService.getTodosPersonalSalud().subscribe({
      next: (medicos: IRecHumano[]) => {
        console.log('Recursos humanos obtenidos:', medicos);

        // === Paso 1: Filtrar por especialidades ===
        const filtradosPorEspecialidad = medicos.filter((medico) =>
          medico.profesionesRecurso?.some((prof) =>
            prof.especialidades?.some((esp) =>
              especialidadesFiltro.includes(esp.especialidadRef),
            ),
          ),
        );

        // === Paso 2: Filtrar por profesiones SIN especialidad ===
        const filtradosPorProfesionSinEsp = medicos.filter((medico) =>
          medico.profesionesRecurso?.some(
            (prof) =>
              profesionesSinEspecialidad.includes(prof.profesionRef) &&
              (!prof.especialidades || prof.especialidades.length === 0),
          ),
        );

        // Unir ambos resultados, evitando duplicados
        const idsFiltrados = new Set(
          filtradosPorEspecialidad.map((m) => m._id),
        );
        for (const medico of filtradosPorProfesionSinEsp) {
          if (!idsFiltrados.has(medico._id)) {
            filtradosPorEspecialidad.push(medico);
            idsFiltrados.add(medico._id);
          }
        }

        console.log('Médicos filtrados:', filtradosPorEspecialidad);
        this.dataSourcePersonal.data = filtradosPorEspecialidad;
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

  seleccionar(personal: IRecHumano): void {
    const profesionesAsociadas = this.data.profesionesAsociadas;

    // Buscar la coincidencia exacta de especialidad
    let especialidadMatch:
      | {
          especialidadRef: string;
          rne?: string;
        }
      | undefined;

    let profesionMatch:
      | {
          profesionRef: string;
          nroColegiatura?: string;
          especialidades?: {
            especialidadRef: string;
            rne?: string;
          }[];
        }
      | undefined;

    // Buscar coincidencia con especialidad
    outer: for (const prof of personal.profesionesRecurso || []) {
      for (const esp of prof.especialidades || []) {
        if (
          profesionesAsociadas.some(
            (p) => p.especialidadId && p.especialidadId === esp.especialidadRef,
          )
        ) {
          especialidadMatch = esp;
          profesionMatch = prof;
          break outer;
        }
      }
    }

    // Si no hay especialidad, buscar profesión sin especialidad
    if (!especialidadMatch) {
      for (const prof of personal.profesionesRecurso || []) {
        if (
          profesionesAsociadas.some(
            (p) => !p.especialidadId && p.profesionId === prof.profesionRef,
          )
        ) {
          profesionMatch = prof;
          break;
        }
      }
    }

    const medicoAtiende = {
      _id: personal._id,
      codRecHumano: personal.codRecHumano,
      nombreRecHumano: personal.nombreRecHumano,
      apePatRecHumano: personal.apePatRecHumano,
      apeMatRecHumano: personal.apeMatRecHumano,
      nroColegiatura: profesionMatch?.nroColegiatura,
      rne: especialidadMatch?.rne,
    };

    this.dialogRef.close(medicoAtiende);

    //this.dialogRef.close(personal);
  }
}
