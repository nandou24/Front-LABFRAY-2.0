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
import { ArchivoPacienteService } from '../../../../../../services/mantenimiento/paciente/archivo-paciente.service';
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
  private _archivoPacienteService = inject(ArchivoPacienteService);
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

  // ====== Fotografía optimizada como en Toma de Muestras ======
  async capturarFoto(): Promise<void> {
    const video = this.cameraPreview?.nativeElement;

    if (!video?.videoWidth || !video.videoHeight || this.procesandoInicio) {
      return;
    }

    const escala = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * escala));
    canvas.height = Math.max(1, Math.round(video.videoHeight * escala));

    const context = canvas.getContext('2d');
    if (!context) {
      await Swal.fire({ icon: 'error', title: 'No se pudo preparar la fotografía' });
      return;
    }

    // ====== Conservar la orientación de cámara frontal ======
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      let resultado: Blob | null = null;
      for (const calidad of [0.86, 0.76, 0.66, 0.56]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', calidad),
        );
        if (!blob) continue;
        resultado = blob;
        if (blob.size <= 1_800_000) break;
      }

      if (!resultado || resultado.size > 1_800_000) {
        await Swal.fire({
          icon: 'warning',
          title: 'Fotografía demasiado grande',
          text: 'Vuelve a capturar la fotografía. Debe pesar menos de 1.8 MB.',
        });
        return;
      }

      if (this.fotoPacienteUrl) URL.revokeObjectURL(this.fotoPacienteUrl);
      this.fotoPaciente = resultado;
      this.fotoPacienteUrl = URL.createObjectURL(resultado);
      this.detenerCamara();
      this._cdr.detectChanges();
    } catch (error) {
      console.error('Error al procesar la fotografía:', error);
      await Swal.fire({ icon: 'error', title: 'No se pudo capturar la fotografía' });
    }
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

    // ====== Confirmar atención con identificación pendiente ======
    const sinDocumento = !this.programacion.nroDoc && !this.programacion.pacienteId;
    if (sinDocumento) {
      const confirmacion = await Swal.fire({
        title: 'Iniciar atención temporal',
        text: 'Se generarán solicitudes sin crear paciente ni HC. Se podrán procesar muestras y validar resultados, pero no liberarlos hasta registrar el documento y resolver la identidad.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Iniciar atención temporal',
        cancelButtonText: 'Volver',
        reverseButtons: true,
      });
      if (!confirmacion.isConfirmed) return;
    }

    // ====== MC.1: captura temporal solo en vista previa ======
    if (sinDocumento && this.fotoPaciente) {
      const aviso = await Swal.fire({
        title: 'Fotografía temporal aún no guardada',
        text: 'La fotografía solo existe en esta vista previa. Si inicias la atención ahora, ' +
          'se descartará sin guardarse ni vincularse a la programación. ' +
          'El registro persistente se habilitará en MC.2.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continuar sin guardar foto',
        cancelButtonText: 'Volver a la fotografía',
        reverseButtons: true,
      });
      if (!aviso.isConfirmed) return;
    }

    // ====== Confirmar foto opcional en atención documentada ======
    if (!this.fotoPaciente && !sinDocumento) {
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
    this.dialogRef.disableClose = true;

    try {
      // ====== Resolver coincidencia de nombres antes de crear una nueva HC ======
      let respuesta: any;
      try {
        respuesta = await firstValueFrom(
          this._programacionService.iniciarAtencionProgramacion(this.programacion._id),
        );
      } catch (error: any) {
        if (error?.error?.codigo !== 'POSIBLE_PACIENTE_EXISTENTE') throw error;

        const candidatos = (error.error.candidatos ?? [])
          .map((paciente: { hc?: string; tipoDoc?: string; nroDoc?: string }) =>
            [paciente.hc, paciente.tipoDoc, paciente.nroDoc].filter(Boolean).join(' · '),
          ).join(' | ');
        const confirmacion = await Swal.fire({
          title: 'Posibles historias clínicas existentes',
          text: `Se encontraron pacientes con los mismos nombres. ${candidatos ? 'HC encontradas: ' + candidatos + '. ' : ''}Si corresponde al mismo paciente, cancela y selecciónalo desde la búsqueda. Para una persona distinta, justifica por qué crearás otra HC provisional.`,
          icon: 'warning',
          input: 'textarea',
          inputLabel: 'Motivo para continuar con una nueva HC provisional',
          inputPlaceholder: 'Explica cómo verificaste que se trata de otro trabajador...',
          inputAttributes: { maxlength: '300' },
          showCancelButton: true,
          confirmButtonText: 'Crear HC provisional',
          cancelButtonText: 'Cancelar y revisar',
          reverseButtons: true,
          inputValidator: (valor) => {
            const longitud = String(valor ?? '').trim().length;
            return longitud < 10 || longitud > 300
              ? 'Indica un motivo de 10 a 300 caracteres.'
              : undefined;
          },
        });
        if (!confirmacion.isConfirmed) return;

        respuesta = await firstValueFrom(
          this._programacionService.iniciarAtencionProgramacion(this.programacion._id, {
            confirmarNuevaHC: true,
            motivoNuevaHC: String(confirmacion.value).trim(),
          }),
        );
      }

      // ====== Guardar fotografía con el paciente confirmado por el backend ======
      const pacienteId = respuesta?.paciente?._id;
      const fotoCapturada = !!this.fotoPaciente;
      let fotografiaGuardada = false;
      if (fotoCapturada && pacienteId && !sinDocumento) {
        fotografiaGuardada = await this.guardarFotoEvaluacionConReintento(
          String(pacienteId),
          String(this.programacion._id),
        );
      } else if (fotoCapturada && !sinDocumento) {
        console.error('La atención no devolvió pacienteId para asociar la fotografía');
      }

      const fotografiaPendiente = fotoCapturada && !fotografiaGuardada;
      await Swal.fire({
        title: fotografiaPendiente ? (sinDocumento ? 'Atención temporal iniciada' : 'Atención iniciada; foto pendiente') : 'Correcto',
        text: fotografiaPendiente
          ? (sinDocumento
            ? 'La fotografía se capturó solo en vista previa y no quedó guardada. El registro persistente se habilitará en MC.2.'
            : 'Se inició la atención, pero la fotografía no quedó registrada. Debe completarse posteriormente.')
          : fotografiaGuardada
            ? 'Atención iniciada y fotografía de evaluación guardada correctamente.'
            : respuesta?.msg || 'La atención fue iniciada correctamente.', 
        icon: fotografiaPendiente ? 'warning' : 'success',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
      });

      this.dialogRef.close({
        ok: true,
        fotografiaGuardada,
        fotografiaPendiente,
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

      if (respuesta?.codigo === 'POSIBLE_PACIENTE_EXISTENTE') {
        const historias = (respuesta.candidatos ?? [])
          .map((c: { hc?: string; tipoDoc?: string; nroDoc?: string }) =>
            [c.hc, c.tipoDoc, c.nroDoc].filter(Boolean).join(' · '),
          )
          .join(' | ');

        await Swal.fire({
          title: 'Posible paciente registrado',
          text: `${respuesta.msg || 'Verifique la identidad antes de continuar.'}${historias ? ' Historias encontradas: ' + historias : ''}`,
          icon: 'warning',
          confirmButtonText: 'Entendido',
        });
        return;
      }

      if (['COINCIDENCIA_DOCUMENTO_EXISTENTE', 'COINCIDENCIAS_IDENTIDAD_PENDIENTES',
        'REVISION_IDENTIDAD_PENDIENTE'].includes(respuesta?.codigo)) {
        await Swal.fire({
          icon: 'warning', title: 'Revisar coincidencias antes de iniciar',
          text: (respuesta?.msg || 'Hay coincidencias pendientes de resolver.') +
            ' Cierra esta ventana y utiliza Revisar coincidencias en la programación.',
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
      this.dialogRef.disableClose = false;
    }
  }


  // ====== Reintentar foto sin duplicar solicitudes ni historias clínicas ======
  private async guardarFotoEvaluacionConReintento(pacienteId: string, programacionId: string): Promise<boolean> {
    if (!this.fotoPaciente) return false;
    while (true) {
      try {
        const respuesta = await firstValueFrom(
          this._archivoPacienteService.subirFotoEvaluacion(
            pacienteId, this.fotoPaciente, programacionId,
          ),
        );
        if (respuesta?.ok !== true || !respuesta?.archivo?._id || !respuesta?.archivo?.storageKey) {
          throw new Error('El backend no confirmó el archivo y la ruta S3');
        }
        return true;
      } catch (error: unknown) {
        console.error('Falló la grabación de la foto de evaluación:', error);
        const resultado = await Swal.fire({
          title: 'Fotografía no guardada',
          text: 'La atención ya está iniciada. Puedes reintentar únicamente la fotografía, sin crear otra atención.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Reintentar fotografía',
          cancelButtonText: 'Continuar sin fotografía',
          allowOutsideClick: false,
          allowEscapeKey: false,
          reverseButtons: true,
        });
        if (!resultado.isConfirmed) return false;
      }
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
