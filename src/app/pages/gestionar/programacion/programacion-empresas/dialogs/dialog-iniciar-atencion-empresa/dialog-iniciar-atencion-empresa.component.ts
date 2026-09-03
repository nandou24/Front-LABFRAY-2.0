import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { UbigeoService } from '../../../../../../services/utilitarios/ubigeo.service';
import { FechaValidatorService } from '../../../../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';
import { DocValidatorService } from '../../../../../../services/utilitarios/validators/docValidator/doc-validator.service';
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import { PacienteService } from '../../../../../../services/mantenimiento/paciente/paciente.service';
import { ProgramacionEmpresaService } from '../../../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';
import {
  IEmpresa,
  IProtocoloEmpresa,
} from '../../../../../../models/Mantenimiento/empresa.models';
import { IProgramacionEmpresa } from '../../../../../../models/Gestion/programacionEmpresa.models';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

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
    MatAutocompleteModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
  ],
  templateUrl: './dialog-iniciar-atencion-empresa.component.html',
  styleUrl: './dialog-iniciar-atencion-empresa.component.scss',
})
export class DialogIniciarAtencionEmpresaComponent
  implements OnInit, OnDestroy
{
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
  private _cdr = inject(ChangeDetectorRef);

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
  public fotoPaciente: Blob | null = null;
  public fotoPacienteUrl: string | null = null;

  public cameraActiva = false;
  private cameraStream?: MediaStream;
  public procesandoInicio = false;

  ngOnInit(): void {
    this.programacion = this.data?.programacion as
      | IProgramacionEmpresa
      | undefined;
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

    if (this.fotoPacienteUrl) {
      URL.revokeObjectURL(this.fotoPacienteUrl);
      this.fotoPacienteUrl = null;
    }

    this.fotoPaciente = null;
  }

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  actualizarEdad(): void {
    const fechaNacimiento =
      this.iniciarAtencionProgramacionForm.get('fechaNacimiento')?.value;
    this.iniciarAtencionProgramacionForm
      .get('edad')
      ?.setValue(
        fechaNacimiento ? this._fechaService.calcularEdad(fechaNacimiento) : '',
      );
  }

  async activarCamara(): Promise<void> {
    try {
      // ==========================================
      // OBTENER STREAM DE LA CÁMARA
      // ==========================================

      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
        },
      });

      // ==========================================
      // MOSTRAR ELEMENTO VIDEO
      // ==========================================

      this.cameraActiva = true;

      // Fuerza a Angular a crear el <video>
      // que depende de *ngIf="cameraActiva"
      this._cdr.detectChanges();

      // ==========================================
      // ASIGNAR STREAM AL VIDEO
      // ==========================================

      const video = this.cameraPreview?.nativeElement;

      if (!video) {
        console.error(
          'No se encontró el elemento de previsualización de la cámara',
        );

        this.detenerCamara();

        return;
      }

      video.srcObject = this.cameraStream;

      await video.play();
    } catch (error) {
      console.error('No se pudo acceder a la cámara:', error);

      this.detenerCamara();

      this._cdr.detectChanges();
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

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('No se pudo generar la fotografía del paciente');
          return;
        }

        this.fotoPaciente = blob;

        this.fotoPacienteUrl = URL.createObjectURL(blob);

        this.detenerCamara();
        this._cdr.detectChanges();
      },
      'image/jpeg',
      0.85,
    );
  }

  async repetirFoto(): Promise<void> {
    if (this.fotoPacienteUrl) {
      URL.revokeObjectURL(this.fotoPacienteUrl);
    }

    this.fotoPaciente = null;
    this.fotoPacienteUrl = null;
    await this.activarCamara();
  }

  async iniciarAtencion(): Promise<void> {
    // ==========================================
    // 1. VALIDAR PROGRAMACIÓN
    // ==========================================

    if (!this.programacion?._id) {
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo identificar la programación.',
        icon: 'error',
        confirmButtonText: 'Ok',
      });

      return;
    }

    // ==========================================
    // 2. SI NO HAY FOTOGRAFÍA
    // ==========================================

    if (!this.fotoPaciente) {
      const resultado = await Swal.fire({
        title: '¿Iniciar sin fotografía?',
        text:
          'El paciente no tiene una fotografía capturada. ' +
          'Podrá registrarla o actualizarla posteriormente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, iniciar atención',
        cancelButtonText: 'Volver',
        reverseButtons: true,
      });

      if (!resultado.isConfirmed) {
        return;
      }
    }

    // ==========================================
    // 3. INICIAR ATENCIÓN EN BACKEND
    // ==========================================

    this.procesandoInicio = true;

    try {
      const respuesta = await firstValueFrom(
        this._programacionService.iniciarAtencionProgramacion(
          this.programacion._id,
        ),
      );

      // ==========================================
      // 4. RESPUESTA CORRECTA
      // ==========================================

      await Swal.fire({
        title: 'Correcto',
        text: respuesta?.msg || 'La atención fue iniciada correctamente.',
        icon: 'success',
        confirmButtonText: 'Ok',
      });

      // ==========================================
      // 5. CERRAR DIÁLOGO
      // ==========================================

      this.dialogRef.close({
        ok: true,

        fotoPaciente: this.fotoPaciente,

        paciente: respuesta?.paciente,

        programacion: respuesta?.programacion,

        respuestaBackend: respuesta,
      });
    } catch (error: any) {
      console.error('Error al iniciar atención:', error);

      const respuesta = error?.error;

      // ==========================================
      // INCONSISTENCIA DE IDENTIDAD
      // ==========================================

      if (respuesta?.codigo === 'INCONSISTENCIA_IDENTIDAD') {
        const programado = respuesta.programacionPaciente;

        const registrado = respuesta.pacienteRegistrado;

        await Swal.fire({
          title: 'Inconsistencia de identidad',

          icon: 'warning',

          html: `
        <div style="text-align:left">

          <p>
            El documento
            <strong>
              ${programado?.tipoDoc ?? ''}
              ${programado?.nroDoc ?? ''}
            </strong>
            ya corresponde a un paciente registrado,
            pero los nombres no coinciden.
          </p>

          <hr>

          <p>
            <strong>Datos de la programación:</strong><br>
            ${programado?.apePatCliente ?? ''}
            ${programado?.apeMatCliente ?? ''}
            ${programado?.nombreCliente ?? ''}
          </p>

          <p>
            <strong>Paciente registrado:</strong><br>
            HC: ${registrado?.hc ?? '-'}<br>
            ${registrado?.apePatCliente ?? ''}
            ${registrado?.apeMatCliente ?? ''}
            ${registrado?.nombreCliente ?? ''}
          </p>

          <hr>

          <p>
            Verifique el documento y los datos del paciente.
            Si existe un error, edite la programación antes
            de iniciar la atención.
          </p>

        </div>
      `,

          confirmButtonText: 'Entendido',
        });

        return;
      }

      if (respuesta?.codigo === 'DOCUMENTO_REQUERIDO') {
        await Swal.fire({
          title: 'Documento requerido',

          text:
            respuesta?.indicacion ||
            'Debe registrar el documento del paciente antes de iniciar la atención.',

          icon: 'warning',

          confirmButtonText: 'Entendido',
        });

        return;
      }

      // ==========================================
      // MOSTRAR MENSAJE DEL BACKEND
      // ==========================================

      await Swal.fire({
        title: 'No se pudo iniciar la atención',
        text: error?.error?.msg || 'Ocurrió un error al iniciar la atención.',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
    } finally {
      this.procesandoInicio = false;
    }
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
