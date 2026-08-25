import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { UbigeoService } from '../../../../../../services/utilitarios/ubigeo.service';
import { FechaValidatorService } from '../../../../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';
import { DocValidatorService } from '../../../../../../services/utilitarios/validators/docValidator/doc-validator.service';
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import { PacienteService } from '../../../../../../services/mantenimiento/paciente/paciente.service';
import { ProgramacionEmpresaService } from '../../../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';
import { IEmpresa, IProtocoloEmpresa } from '../../../../../../models/Mantenimiento/empresa.models';
import { IProgramacionEmpresa } from '../../../../../../models/Gestion/programacionEmpresa.models';

@Component({
  selector: 'app-dialog-iniciar-atencion-empresa',
  imports: [
        CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
  ],
  templateUrl: './dialog-iniciar-atencion-empresa.component.html',
  styleUrl: './dialog-iniciar-atencion-empresa.component.scss'
})
export class DialogIniciarAtencionEmpresaComponent implements OnInit, OnDestroy {
  @ViewChild('cameraPreview') cameraPreview?: ElementRef<HTMLVideoElement>;

    constructor(
    public dialogRef: MatDialogRef<DialogIniciarAtencionEmpresaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _ubigeoService: UbigeoService,
  ) {}

  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);
  private _empresaService = inject(EmpresaService);
  private _pacienteService = inject(PacienteService);
  private _programacionService = inject(ProgramacionEmpresaService);
  private _fb = inject(FormBuilder);

  public iniciarAtencionProgramacionForm: FormGroup = this._fb.group({
    _id: [null],
    hc: [null],
    estadoProgramacion: ['PROGRAMADO'],
    tipoDoc: ['DNI'], // Valor por defecto: DNI
    nroDoc: ['', [this._documentValidator.documentValidator('tipoDoc')]],
    apePatCliente: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    apeMatCliente: ['', [Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)]],
    nombreCliente: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    fechaNacimiento: ['', [this._fechaService.fechaNoFuturaValidator()]],
    edad: [{ value: '', disabled: true }],
    sexoCliente: [],
    phones: this._fb.array([]),
    empresa: [null as IEmpresa | null, Validators.required],
    protocoloEmpresa: [
      { value: null as IProtocoloEmpresa | null, disabled: true },
    ],
    empresaId: [''],
    rucEmpresa: [''],
    razonSocialEmpresa: [''],
    fechaProgramacion: [new Date(), Validators.required],
    sede: ['Callao'],
    tipoEvaluacion: ['ETAs'],
    tipoAtencion: ['Regular'],
    prioridad: ['Normal'],
    observaciones: [''],
  });

  public programacion?: IProgramacionEmpresa;
  public columnasServicios: string[] = ['codigo', 'nombre'];
  public fotoPaciente = '';
  public cameraActiva = false;
  private cameraStream?: MediaStream;

  ngOnInit(): void {
    this.programacion = this.data?.programacion as IProgramacionEmpresa | undefined;
    if (!this.programacion) {
      this.dialogRef.close();
      return;
    }

    this.iniciarAtencionProgramacionForm.patchValue({
      _id: this.programacion._id ?? null,
      hc: this.programacion.hc ?? null,
      estadoProgramacion: this.programacion.estadoProgramacion,
      tipoDoc: this.programacion.tipoDoc,
      nroDoc: this.programacion.nroDoc,
      apePatCliente: this.programacion.apePatCliente,
      apeMatCliente: this.programacion.apeMatCliente,
      nombreCliente: this.programacion.nombreCliente,
      fechaNacimiento: this.programacion.fechaNacimiento ?? '',
      sexoCliente: this.programacion.sexoCliente ?? null,
      empresaId: this.programacion.empresaId,
      rucEmpresa: this.programacion.rucEmpresa,
      razonSocialEmpresa: this.programacion.razonSocialEmpresa,
      fechaProgramacion: this.programacion.fechaProgramada,
      observaciones: this.programacion.observaciones ?? '',
    });

    this.actualizarEdad();
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }

    //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }


  actualizarEdad(): void {
    const fechaNacimiento = this.iniciarAtencionProgramacionForm.get('fechaNacimiento')?.value;
    this.iniciarAtencionProgramacionForm.get('edad')?.setValue(
      fechaNacimiento ? this._fechaService.calcularEdad(fechaNacimiento) : '',
    );
  }

  async activarCamara(): Promise<void> {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      this.cameraActiva = true;

      setTimeout(() => {
        if (this.cameraPreview) {
          this.cameraPreview.nativeElement.srcObject = this.cameraStream ?? null;
        }
      });
    } catch (error) {
      console.error('No se pudo acceder a la cámara:', error);
    }
  }

  capturarFoto(): void {
    const video = this.cameraPreview?.nativeElement;
    if (!video?.videoWidth || !video.videoHeight) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.translate(canvas.width, 0);
    context?.scale(-1, 1);
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    this.fotoPaciente = canvas.toDataURL('image/jpeg', 0.85);
    this.detenerCamara();
  }

  repetirFoto(): void {
    this.fotoPaciente = '';
    this.activarCamara();
  }

  iniciarAtencion(): void {
    this.dialogRef.close({ fotoPaciente: this.fotoPaciente });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private detenerCamara(): void {
    this.cameraStream?.getTracks().forEach((track) => track.stop());
    this.cameraStream = undefined;
    this.cameraActiva = false;
  }

}
