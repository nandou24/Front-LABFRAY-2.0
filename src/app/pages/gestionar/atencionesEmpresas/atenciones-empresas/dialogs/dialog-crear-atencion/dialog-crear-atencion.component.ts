import { Component, inject, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { map, Observable, of, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  IEmpresa,
  IUbicacionSede,
} from '../../../../../../models/Mantenimiento/empresa.models';
import { IServicio } from '../../../../../../models/Mantenimiento/servicios.models';
import { IRecHumano } from '../../../../../../models/Mantenimiento/recursoHumano.models';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';

// interface Empresa {
//   _id: string;
//   ruc: string;
//   razonSocial: string;
//   sedes: { _id: string; nombre: string; direccion?: string }[];
// }

// interface Protocolo {
//   _id: string;
//   nombre: string;
// }
// interface SedeInterna {
//   _id: string;
//   nombre: string;
// }
// interface Personal {
//   _id: string;
//   nombre: string;
// }

@Component({
  selector: 'app-dialog-crear-atencion',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatAutocompleteModule,
  ],
  templateUrl: './dialog-crear-atencion.component.html',
  styleUrl: './dialog-crear-atencion.component.scss',
})
export class DialogCrearAtencionComponent implements OnInit {
  constructor() {}

  private _fb = inject(FormBuilder);
  private dialog = inject(MatDialogRef<DialogCrearAtencionComponent>);
  isEditable = false;

  ngOnInit(): void {
    this._adapter.setLocale('es-PE');
  }

  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  // formProgramacion = this._fb.group({
  //   empresa: this._fb.group({
  //     empresa: [null, Validators.required], // objeto seleccionado -> luego empresaId
  //     protocolo: [null, Validators.required],
  //     observacion: [''],
  //   }),
  //   programacion: this._fb.group({
  //     programaciones: this._fb.array([
  //       this._fb.group({
  //         fecha: [null, Validators.required],
  //         horaInicio: ['', Validators.required],
  //         horaFin: ['', Validators.required],
  //         sedeEmpresa: [null],
  //         direccion: [''],
  //         linkMaps: [''],
  //       }),
  //     ]),
  //   }),
  //   equipo: this._fb.group({
  //     sedeInterna: [null, Validators.required],
  //     responsable: [null, Validators.required],
  //     equipo: this._fb.control<any[]>([]),
  //     notas: [''],
  //   }),
  // });

  // get fEmp() {
  //   return this.formProgramacion.get('empresa') as FormGroup;
  // }
  // get fProg() {
  //   return this.formProgramacion.get('programacion') as FormGroup;
  // }
  // get fEq() {
  //   return this.formProgramacion.get('equipo') as FormGroup;
  // }
  // get programaciones() {
  //   return this.fProg.get('programaciones') as FormArray;
  // }

  // --- data sources (reemplaza por tus services) ---
  empresas: IEmpresa[] = []; // cargar desde API
  protocolos: IServicio[] = []; // cargar desde API
  sedesInternas: IUbicacionSede[] = []; // cargar desde API
  personal: IRecHumano[] = []; // cargar desde API

  empresasFiltradas$!: Observable<IEmpresa[]>;
  protocolosFiltrados$!: Observable<IServicio[]>;
  personalFiltrado$!: Observable<IRecHumano[]>;

  empresaSeleccionada?: IEmpresa;

  // Step 1
  groupEmpresa = this._fb.group({
    empresa: [null, Validators.required], // guarda objeto; luego puedes mapear a empresaId
    protocolo: [null, Validators.required],
    observacion: [''],
  });

  // Step 2
  groupProgramacion = this._fb.group({
    sedeEmpresa: [null, Validators.required],
    direccion: [null, Validators.required],
    linkMaps: [null, Validators.required],
    turnos: this._fb.array([this.nuevaProg()]),
  });

  get turnos(): FormArray {
    return this.groupProgramacion.get('turnos') as FormArray;
  }

  // Step 3
  groupEquipo = this._fb.group({
    sedeInterna: [null, Validators.required],
    responsable: [null, Validators.required], // 1 responsable
    equipo: [[]], // array (chips)
    notas: [''],
  });

  setFlex(grow: number, valor: number, unidad: 'px' | '%' = 'px'): string {
    if (grow > 0) {
      return `${grow} 0 0`;
    } else {
      return `0 0 ${valor}${unidad}`;
    }
  }

  displayEmpresa = (e?: IEmpresa) => (e ? `${e.razonSocial} (${e.ruc})` : '');
  displayProtocolo = (p?: IServicio) => (p ? p.nombreServicio : '');
  displayPersonal = (p?: IRecHumano) => (p ? p.nombreRecHumano : '');

  onEmpresaSelected(e: IEmpresa) {
    this.empresaSeleccionada = e;
    // opcional: autoseleccionar su primera sede para cada programación
    this.turnos.controls.forEach((ctrl) =>
      ctrl.get('sedeEmpresa')?.setValue(null),
    );
  }

  nuevaProg(): FormGroup {
    return this._fb.group({
      fecha: [null, Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      sedeEmpresa: [null], // una de las sedes de la empresa
      direccion: [''],
      linkMaps: [''],
    });
  }
  agregarProg() {
    this.turnos.push(this.nuevaProg());
  }
  eliminarProg(i: number) {
    this.turnos.removeAt(i);
  }

  cancelar() {
    this.dialog.close();
  }

  crear() {
    // if (
    //   this.fgEmpresa.invalid ||
    //   this.fgProgramacion.invalid ||
    //   this.fgEquipo.invalid
    // )
    //   return;
    // const empresaObj: IEmpresa = this.fgEmpresa.value.empresa;
    // const protocoloObj: IServicio = this.fgEmpresa.value.protocolo;
    // const dto = {
    //   empresaId: empresaObj._id,
    //   protocoloId: protocoloObj._id,
    //   observacion: this.fgEmpresa.value.observacion,
    //   programaciones: this.programaciones.value.map((p: any) => ({
    //     fecha: p.fecha,
    //     horaInicio: p.horaInicio,
    //     horaFin: p.horaFin,
    //     sedeEmpresaId: p.sedeEmpresa?._id || null,
    //     direccion: p.direccion || null,
    //     linkMaps: p.linkMaps || null,
    //   })),
    //   sedeInternaId: this.fgEquipo.value.sedeInterna._id,
    //   responsableId: this.fgEquipo.value.responsable._id,
    //   equipoIds: (this.fgEquipo.value.equipo || []).map(
    //     (x: IRecHumano) => x._id,
    //   ),
    //   notas: this.fgEquipo.value.notas || null,
    // };
    // this.dialog.close(dto); // el padre llama a tu service para persistir
  }
}
