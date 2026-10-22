import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { RolesService } from '../../../../services/permisos/roles/roles.service';
import { RecursoHumanoService } from '../../../../services/mantenimiento/recursoHumano/recurso-humano.service';
import { customPaginatorIntl } from '../../../../services/utilitarios/mat-paginator-intl';
import { UbigeoService } from '../../../../services/utilitarios/ubigeo.service';
import { ProfesionService } from '../../../../services/mantenimiento/profesion/profesion.service';
import { EspecialidadService } from '../../../../services/mantenimiento/especialidad/especialidad.service';
import { FechaValidatorService } from '../../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';
import { DocValidatorService } from '../../../../services/utilitarios/validators/docValidator/doc-validator.service';
import { IRol } from '../../../../models/permisos/roles.models';
import { IRecHumano, IPresentacionFirmaRRHH } from '../../../../models/Mantenimiento/recursoHumano.models';

@Component({
  selector: 'app-mant-recurso-humano',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTableModule,
    MatPaginator,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CommonModule,
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: customPaginatorIntl },
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
  ],
  templateUrl: './mant-recurso-humano.component.html',
  styleUrl: './mant-recurso-humano.component.scss',
})
export class MantRecursoHumanoComponent implements OnInit, AfterViewInit {
  private _fb = inject(FormBuilder);
  private _rolesService = inject(RolesService);
  private _recHumanoService = inject(RecursoHumanoService);
  private _ubigeoService = inject(UbigeoService);
  private _profesionService = inject(ProfesionService);
  private _especialidadService = inject(EspecialidadService);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  // ====== Firma de informes: administración independiente ======
  readonly serviciosFirmables = [
    'Laboratorio', 'Ecografía', 'Rayos X', 'Consulta', 'Procedimiento',
  ];
  profesionalFirma: IRecHumano | null = null;
  imagenFirmaPreview: string | null = null;
  archivoFirmaPendiente: File | null = null;
  guardandoFirma = false;
  cargandoImagenFirma = false;
  estadoImagenFirma = '';
  private solicitudImagenFirma = 0;
  perfilesFirma: IPresentacionFirmaRRHH[] = [];
  perfilFirmaActualId = '';
  especialidadesCatalogoFirma: any[] = [];
  private archivosPendientesFirma = new Map<string, File>();
  private previewsPendientesFirma = new Map<string, string>();
  readonly tratamientosFirma = ['Dr.', 'Dra.', 'Lic.', 'Licda.', 'Mg.', 'Mgt.', 'Obst.', 'Enf.', 'Blgo.', 'Q.F.', 'Tec.', 'Otro'];
  readonly formFirmaLaboratorio = this._fb.nonNullable.group({
    habilitado: false,
    profesionRecursoId: '',
    serviciosAutorizados: this._fb.nonNullable.control<string[]>([]),
    predeterminadoLaboratorio: false,
    predeterminadoGeneral: false,
    referenciaAutorizacion: '',
    etiqueta: 'Firma profesional',
    tratamiento: '',
    tratamientoPersonalizado: '',
    especialidadId: '',
    mostrarProfesion: true,
    mostrarEspecialidad: true,
    mostrarColegiatura: true,
    mostrarRne: true,
    siglaColegiatura: 'Colegiatura',
    siglaEspecialidad: 'RNE',
  });

  // ====== Formatos de firma independientes del maestro profesional ======
  private crearPresentacionFirma(profesionRecursoId = ''): IPresentacionFirmaRRHH {
    return {
      perfilId: crypto.randomUUID(), etiqueta: 'Nueva firma', tratamiento: '',
      profesionRecursoId, especialidadId: null,
      mostrarProfesion: true, mostrarEspecialidad: true,
      mostrarColegiatura: true, mostrarRne: true,
      siglaColegiatura: 'Colegiatura', siglaEspecialidad: 'RNE',
      serviciosAutorizados: ['Laboratorio'], esPrincipal: true,
    };
  }

  private presentacionActiva(): IPresentacionFirmaRRHH | undefined {
    return this.perfilesFirma.find((item) => item.perfilId === this.perfilFirmaActualId);
  }

  private guardarEdicionPerfilEnMemoria(): void {
    const perfil = this.presentacionActiva();
    if (!perfil) return;
    const datos = this.formFirmaLaboratorio.getRawValue();
    perfil.etiqueta = datos.etiqueta.trim();
    perfil.tratamiento = datos.tratamiento === 'Otro' ? datos.tratamientoPersonalizado.trim() : datos.tratamiento.trim();
    perfil.profesionRecursoId = datos.profesionRecursoId;
    perfil.especialidadId = datos.especialidadId || null;
    perfil.serviciosAutorizados = [...datos.serviciosAutorizados];
    perfil.mostrarProfesion = datos.mostrarProfesion;
    perfil.mostrarEspecialidad = datos.mostrarEspecialidad;
    perfil.mostrarColegiatura = datos.mostrarColegiatura;
    perfil.mostrarRne = datos.mostrarRne;
    perfil.siglaColegiatura = datos.siglaColegiatura.trim();
    perfil.siglaEspecialidad = datos.siglaEspecialidad.trim();
    perfil.esPrincipal = datos.predeterminadoLaboratorio;
    if (perfil.esPrincipal) {
      this.perfilesFirma.forEach((otra) => {
        if (otra.perfilId !== perfil.perfilId) otra.esPrincipal = false;
      });
    }
  }

  seleccionarPerfilFirma(perfilId: string, guardarAnterior = true): void {
    if (guardarAnterior) this.guardarEdicionPerfilEnMemoria();
    this.perfilFirmaActualId = perfilId;
    const perfil = this.presentacionActiva();
    if (!perfil || !this.profesionalFirma) return;
    this.formFirmaLaboratorio.patchValue({
      etiqueta: perfil.etiqueta,
      tratamiento: this.tratamientosFirma.includes(perfil.tratamiento) ? perfil.tratamiento : (perfil.tratamiento ? 'Otro' : ''),
      tratamientoPersonalizado: this.tratamientosFirma.includes(perfil.tratamiento) ? '' : perfil.tratamiento,
      profesionRecursoId: perfil.profesionRecursoId,
      especialidadId: perfil.especialidadId ?? '',
      serviciosAutorizados: [...perfil.serviciosAutorizados],
      predeterminadoLaboratorio: perfil.esPrincipal,
      mostrarProfesion: perfil.mostrarProfesion,
      mostrarEspecialidad: perfil.mostrarEspecialidad,
      mostrarColegiatura: perfil.mostrarColegiatura,
      mostrarRne: perfil.mostrarRne,
      siglaColegiatura: perfil.siglaColegiatura,
      siglaEspecialidad: perfil.siglaEspecialidad,
    });
    this.cargarEspecialidadesFirma();
    this.cargarImagenFirma(this.profesionalFirma.codRecHumano, perfilId);
  }

  agregarPerfilFirma(): void {
    if (this.perfilesFirma.length >= 6) {
      this.mostrarAlertaError('Máximo 6 presentaciones de firma por profesional');
      return;
    }
    this.guardarEdicionPerfilEnMemoria();
    const profesion = this.profesionesFirmante[0]?._id ?? '';
    const nuevo = this.crearPresentacionFirma(profesion);
    nuevo.esPrincipal = this.perfilesFirma.length === 0;
    this.perfilesFirma.push(nuevo);
    this.seleccionarPerfilFirma(nuevo.perfilId, false);
  }

  eliminarPerfilFirma(): void {
    const perfil = this.presentacionActiva();
    if (!perfil || this.perfilesFirma.length < 2) {
      this.mostrarAlertaError('Debe conservar al menos una presentación');
      return;
    }
    this.perfilesFirma = this.perfilesFirma.filter((item) => item.perfilId !== perfil.perfilId);
    this.archivosPendientesFirma.delete(perfil.perfilId);
    this.previewsPendientesFirma.delete(perfil.perfilId);
    if (perfil.esPrincipal) this.perfilesFirma[0].esPrincipal = true;
    this.seleccionarPerfilFirma(this.perfilesFirma[0].perfilId, false);
  }

  // ====== Especialidades reales de la profesión seleccionada ======
  get especialidadesFirma(): Array<{ id: string; nombre: string; rne: string }> {
    const id = this.formFirmaLaboratorio.controls.profesionRecursoId.value;
    const profesion = this.profesionesFirmante.find((p) => String(p._id) === id);
    return (profesion?.especialidades ?? []).map((esp: any) => ({
      id: String(esp._id ?? ''),
      nombre: this.especialidadesCatalogoFirma.find(
        (item) => String(item._id) === String(esp.especialidadRef?._id ?? esp.especialidadRef),
      )?.nombreEspecialidad ?? 'Especialidad registrada',
      rne: String(esp.rne ?? ''),
    }));
  }

  cargarEspecialidadesFirma(): void {
    const id = this.formFirmaLaboratorio.controls.profesionRecursoId.value;
    const profesion = this.profesionesFirmante.find((p) => String(p._id) === id);
    const profesionMaestraId = String(profesion?.profesionRef?._id ?? profesion?.profesionRef ?? '');
    if (!profesionMaestraId) { this.especialidadesCatalogoFirma = []; return; }
    this._especialidadService.getEspecialidadesPorProfesion(profesionMaestraId).subscribe({
      next: (datos) => { this.especialidadesCatalogoFirma = datos; },
      error: () => { this.especialidadesCatalogoFirma = []; },
    });
  }

  cambiarProfesionFirma(): void {
    this.formFirmaLaboratorio.controls.especialidadId.setValue('');
    this.cargarEspecialidadesFirma();
  }

  get nombrePrevisualizacionFirma(): string {
    const r = this.profesionalFirma;
    if (!r) return '';
    const nombre = [r.apePatRecHumano, r.apeMatRecHumano, r.nombreRecHumano]
      .filter(Boolean).join(' ').toLowerCase()
      .replace(/(^|\s)([a-záéíóúñ])/g, (_, esp, letra) => `${esp}${letra.toUpperCase()}`);
    const tituloSeleccionado = this.formFirmaLaboratorio.controls.tratamiento.value;
    const titulo = tituloSeleccionado === 'Otro' ?
      this.formFirmaLaboratorio.controls.tratamientoPersonalizado.value.trim() : tituloSeleccionado;
    return `${titulo ? titulo + ' ' : ''}${nombre}`;
  }

  get profesionPrevisualizacionFirma(): string {
    const form = this.formFirmaLaboratorio.controls;
    if (!form.mostrarProfesion.value) return '';
    const profesion = this.profesionesFirmante.find((p) => String(p._id) === form.profesionRecursoId.value);
    return profesion ? this.nombreProfesionFirma(profesion) : '';
  }

  get especialidadPrevisualizacionFirma(): string {
    if (!this.formFirmaLaboratorio.controls.mostrarEspecialidad.value) return '';
    return this.especialidadesFirma.find(
      (x) => x.id === this.formFirmaLaboratorio.controls.especialidadId.value,
    )?.nombre ?? '';
  }

  get registrosPrevisualizacionFirma(): string {
    const form = this.formFirmaLaboratorio.controls;
    const profesion = this.profesionesFirmante.find((p) => String(p._id) === form.profesionRecursoId.value);
    const registro = form.mostrarColegiatura.value && profesion?.nroColegiatura ?
      `${form.siglaColegiatura.value}. ${profesion.nroColegiatura}` : '';
    const espec = this.especialidadesFirma.find((x) => x.id === form.especialidadId.value);
    const especialidad = form.mostrarRne.value && espec?.rne ?
      `${form.siglaEspecialidad.value}. ${espec.rne}` : '';
    return [registro, especialidad].filter(Boolean).join(' · ');
  }

  get profesionesFirmante() {
    return (this.profesionalFirma?.profesionesRecurso ?? []).filter(
      (p) => Boolean(String(p.nroColegiatura ?? '').trim()),
    );
  }

  nombreProfesionFirma(profesion: any): string {
    const id = String(profesion?.profesionRef?._id ?? profesion?.profesionRef ?? '');
    return this.profesiones.find((p) => String(p._id) === id)?.nombreProfesion ?? 'Profesión registrada';
  }

  // ====== Verificar cabecera PNG recibida ======
  private async esImagenPng(archivo: Blob): Promise<boolean> {
    if (archivo.type !== 'image/png' || archivo.size < 40) return false;
    const cabecera = new Uint8Array(await archivo.slice(0, 8).arrayBuffer());
    const firmaPng = [137, 80, 78, 71, 13, 10, 26, 10];
    return firmaPng.every((valor, indice) => cabecera[indice] === valor);
  }

  // ====== Recuperar y previsualizar firma desde MongoDB ======
  private async cargarImagenFirma(codigo: string, perfilId = 'legacy'): Promise<void> {
    const solicitud = ++this.solicitudImagenFirma;
    this.imagenFirmaPreview = this.previewsPendientesFirma.get(perfilId) ?? null;
    if (this.imagenFirmaPreview) {
      this.cargandoImagenFirma = false;
      this.estadoImagenFirma = 'Vista previa local: pendiente de guardar';
      return;
    }
    this.estadoImagenFirma = 'Consultando imagen registrada...';
    this.cargandoImagenFirma = true;
    try {
      const archivo = await firstValueFrom(this._recHumanoService.consultarImagenFirma(codigo, perfilId));
      if (solicitud !== this.solicitudImagenFirma ||
          this.profesionalFirma?.codRecHumano !== codigo || this.perfilFirmaActualId !== perfilId) return;
      if (!(await this.esImagenPng(archivo))) {
        throw new Error('El servidor no devolvió una imagen PNG válida');
      }
      const lector = new FileReader();
      lector.onload = () => {
        if (solicitud !== this.solicitudImagenFirma ||
            this.profesionalFirma?.codRecHumano !== codigo || this.perfilFirmaActualId !== perfilId) return;
        const vista = String(lector.result ?? '');
        if (!vista.startsWith('data:image/png;base64,')) {
          this.estadoImagenFirma = 'No fue posible leer la firma almacenada';
          this.imagenFirmaPreview = null;
          return;
        }
        this.imagenFirmaPreview = vista;
        this.estadoImagenFirma = 'Firma PNG registrada en MongoDB';
      };
      lector.onerror = () => {
        if (solicitud === this.solicitudImagenFirma) {
          this.imagenFirmaPreview = null;
          this.estadoImagenFirma = 'Error al leer la imagen de firma';
        }
      };
      lector.readAsDataURL(archivo);
    } catch (error: any) {
      if (solicitud !== this.solicitudImagenFirma ||
          this.profesionalFirma?.codRecHumano !== codigo || this.perfilFirmaActualId !== perfilId) return;
      this.imagenFirmaPreview = null;
      let detalle: { codigo?: string; msg?: string } = {};
      if (error?.error instanceof Blob) {
        try { detalle = JSON.parse(await error.error.text()); } catch { detalle = {}; }
      }
      if (error?.status === 404 && detalle.codigo === 'FIRMA_SIN_IMAGEN') {
        this.estadoImagenFirma = 'Aún no hay una firma PNG registrada';
      } else if (error?.status === 403) {
        this.estadoImagenFirma = 'No tiene permiso para consultar esta firma';
      } else {
        this.estadoImagenFirma = detalle.msg || error?.message ||
          'No se pudo recuperar la imagen de firma';
      }
    } finally {
      if (solicitud === this.solicitudImagenFirma) {
        this.cargandoImagenFirma = false;
      }
    }
  }

  seleccionarImagenFirma(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (!archivo) return;
    if (archivo.type !== 'image/png' || archivo.size > 300 * 1024) {
      this.mostrarAlertaError('La firma debe ser PNG transparente y pesar máximo 300 KB');
      input.value = '';
      return;
    }
    const solicitud = ++this.solicitudImagenFirma;
    const codigo = this.profesionalFirma?.codRecHumano;
    const perfilId = this.perfilFirmaActualId;
    this.cargandoImagenFirma = false;
    this.archivoFirmaPendiente = archivo;
    this.archivosPendientesFirma.set(this.perfilFirmaActualId, archivo);
    this.estadoImagenFirma = 'Vista previa local: pendiente de guardar';
    const lector = new FileReader();
    lector.onload = () => {
      if (solicitud === this.solicitudImagenFirma &&
          this.profesionalFirma?.codRecHumano === codigo && this.perfilFirmaActualId === perfilId) {
        this.imagenFirmaPreview = String(lector.result ?? '');
        this.previewsPendientesFirma.set(this.perfilFirmaActualId, this.imagenFirmaPreview);
      }
    };
    lector.onerror = () => {
      if (solicitud === this.solicitudImagenFirma) {
        this.imagenFirmaPreview = null;
        this.estadoImagenFirma = 'No fue posible previsualizar el PNG seleccionado';
      }
    };
    lector.readAsDataURL(archivo);
  }

  async guardarFirmaLaboratorio(): Promise<void> {
    const codigo = this.profesionalFirma?.codRecHumano;
    if (!codigo || this.guardandoFirma) return;
    this.guardarEdicionPerfilEnMemoria();
    const datos = this.formFirmaLaboratorio.getRawValue();
    const principal = this.perfilesFirma.find((p) => p.esPrincipal);
    if (datos.habilitado && (!principal || !datos.referenciaAutorizacion.trim())) {
      this.mostrarAlertaError('Configure una firma principal y referencia de autorización');
      return;
    }
    this.guardandoFirma = true;
    try {
      const configuracion = {
        habilitado: datos.habilitado,
        profesionRecursoId: principal?.profesionRecursoId ?? null,
        serviciosAutorizados: [...new Set(this.perfilesFirma.flatMap((p) => p.serviciosAutorizados))],
        predeterminadoLaboratorio: datos.habilitado && datos.predeterminadoGeneral,
        referenciaAutorizacion: datos.referenciaAutorizacion.trim(),
        presentaciones: this.perfilesFirma.map((p) => ({ ...p })),
      };
      // ====== Configuración antes de subir los PNG individuales ======
      await firstValueFrom(this._recHumanoService.configurarFirmaLaboratorio(codigo, configuracion));
      for (const [perfilId, archivo] of this.archivosPendientesFirma) {
        await firstValueFrom(this._recHumanoService.subirImagenFirma(codigo, archivo, perfilId));
      }
      this.archivosPendientesFirma.clear();
      this.previewsPendientesFirma.clear();
      this.archivoFirmaPendiente = null;
      if (this.profesionalFirma?.codRecHumano === codigo) {
        this.profesionalFirma = { ...this.profesionalFirma,
          firmaLaboratorio: {
            ...configuracion,
            presentaciones: configuracion.presentaciones,
          },
        };
      }
      this.mostrarAlertaExito('Presentaciones de firma guardadas');
      this.ultimosRecHumano();
      this.cargarImagenFirma(codigo, this.perfilFirmaActualId);
    } catch (error: any) {
      this.mostrarAlertaError(error?.error?.msg || 'No se pudo guardar el perfil de firma o su imagen');
    } finally {
      this.guardandoFirma = false;
    }
  }

  constructor() {}

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15');
    this.distritos = this._ubigeoService.getDistrito('15', '01');
    this.suscribirseUsuarioSistema();
    this.onDepartamentoChange();
    this.onProvinciaChange();
    this.ultimosRecHumano();
    this.listarRolesDisponibles();
    this.listarProfesiones();
    this._adapter.setLocale('es-PE'); // Establecer el locale para el adaptador de fecha
  }

  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);

  public myFormRecHumano: FormGroup = this._fb.group({
    codRecHumano: '',
    tipoDoc: ['', [Validators.required]],
    nroDoc: [
      '',
      [
        Validators.required,
        this._documentValidator.documentValidator('tipoDoc'),
      ],
    ],
    nombreRecHumano: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    apePatRecHumano: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    apeMatRecHumano: ['', [Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)]],
    fechaNacimiento: [
      '',
      [Validators.required, this._fechaService.fechaNoFuturaValidator()],
    ],
    edad: [{ value: '', disabled: true }],
    sexoRecHumano: ['', [Validators.required]],
    departamentoRecHumano: ['15'],
    provinciaRecHumano: ['01'],
    distritoRecHumano: ['', [Validators.required]],
    direcRecHumano: [''],
    mailRecHumano: ['', [Validators.email]],
    phones: this._fb.array([], Validators.required),
    gradoInstruccion: ['', [Validators.required]],
    profesionesRecurso: this._fb.array([]),
    atiendeConsultas: [false, Validators.required],
    usuarioSistema: false,
    datosLogueo: this._fb.group({
      nombreUsuario: [{ value: '', disabled: true }, [Validators.required]],
      correoLogin: [{ value: '', disabled: true }, [Validators.email]],
      passwordHash: [{ value: '', disabled: true }, [Validators.required]],
      rol: [{ value: '', disabled: true }, [Validators.required]],
      sedeAsignada: [{ value: '', disabled: true }, [Validators.required]],
      estado: [{ value: false, disabled: true }], // puede ser ACTIVO / INACTIVO
    }),
  });

  crearProfesion(): FormGroup {
    return this._fb.group({
      _id: [undefined],
      profesionRef: [''],
      //codProfesion: ['', Validators.required],
      nivelProfesion: ['', Validators.required],
      titulo: [''],
      nroColegiatura: [''],
      centroEstudiosProfesion: [''],
      anioEgresoProfesion: [''],
      especialidades: this._fb.array([]),
    });
  }

  crearEspecialidad(): FormGroup {
    return this._fb.group({
      _id: [undefined],
      especialidadRef: [''],
      //codEspecialidad: ['', Validators.required],
      rne: ['', Validators.required],
      centroEstudiosEspecialidad: [''],
      anioEgresoEspecialidad: [''],
    });
  }

  get phones(): FormArray {
    return this.myFormRecHumano.get('phones') as FormArray;
  }

  get profesionesRecurso(): FormArray {
    return this.myFormRecHumano.get('profesionesRecurso') as FormArray;
  }

  especialidades(i: number): FormArray {
    return this.profesionesRecurso.at(i).get('especialidades') as FormArray;
  }

  get datosLogueo(): FormGroup {
    return this.myFormRecHumano.get('datosLogueo') as FormGroup;
  }

  hidePassword = true;

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];
  public rolesDisponibles: IRol[] = [];

  listarRolesDisponibles() {
    this._rolesService.getAllRoles().subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles;
      },
      error: () => {
        this.rolesDisponibles = [];
      },
    });
  }

  // Método separado para manejar el cambio de departamento
  onDepartamentoChange(): void {
    this.myFormRecHumano
      .get('departamentoRecHumano')
      ?.valueChanges.subscribe((departamentoId) => {
        // Obtener y cargar las provincias según el departamento seleccionado
        this.provincias = this._ubigeoService.getProvincia(departamentoId);
        this.distritos = this._ubigeoService.getDistrito(departamentoId, '01');
        // Reiniciar el select de provincias
        this.myFormRecHumano.get('provinciaRecHumano')?.setValue('01'); // Limpia la selección de provincias
      });
  }

  onProvinciaChange(): void {
    this.myFormRecHumano
      .get('provinciaRecHumano')
      ?.valueChanges.subscribe((provinciaId) => {
        const departamentoId = this.myFormRecHumano.get(
          'departamentoRecHumano',
        )?.value;
        this.distritos = this._ubigeoService.getDistrito(
          departamentoId,
          provinciaId,
        );
        this.myFormRecHumano.get('distritoRecHumano')?.setValue('01');
      });
  }

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  agregarTelefono() {
    const telefonoForm = this._fb.group({
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^\d{9,11}$/)],
      ],
      descriptionPhone: ['', [Validators.required, Validators.maxLength(30)]],
    });

    this.phones.push(telefonoForm);
  }

  eliminarTelefono(index: number) {
    this.phones.removeAt(index);
  }

  agregarProfesion() {
    this.profesionesRecurso.push(this.crearProfesion());
  }

  eliminarProfesion(index: number) {
    this.profesionesRecurso.removeAt(index);
  }

  agregarEspecialidad(i: number) {
    this.especialidades(i).push(this.crearEspecialidad());
  }

  eliminarEspecialidad(i: number, j: number) {
    this.especialidades(i).removeAt(j);
  }

  public formSubmitted: boolean = false;

  validarArrayTelefono(): boolean {
    const telefonos = this.myFormRecHumano.get('phones') as FormArray;

    if (telefonos.length > 0) {
      return true;
    }
    return false;
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorRecHumano') paginatorRecHumano!: MatPaginator;
  ngAfterViewInit() {
    this.dataSourceRecursoHumano.paginator = this.paginatorRecHumano;
  }

  //Tabla rrhh
  columnasTablaRecursoHumano: string[] = [
    'nro',
    'codigo',
    'nombreCompleto',
    'nroDoc',
  ];
  dataSourceRecursoHumano = new MatTableDataSource<IRecHumano>();

  filaSeleccionadaIndex: number | null = null;

  cargarRecursoHumano(recursoHumano: IRecHumano, index: number): void {
    this.filaSeleccionadaIndex = index;
    this.recHumanoSeleccionado = true;
    this.profesionalFirma = recursoHumano;
    this.archivoFirmaPendiente = null;
    this.archivosPendientesFirma.clear();
    this.previewsPendientesFirma.clear();
    const configuracion = recursoHumano.firmaLaboratorio;
    const perfiles = configuracion?.presentaciones ?? [];
    this.perfilesFirma = perfiles.length
      ? perfiles.map((item) => ({ ...item, perfilId: item.perfilId || 'legacy',
          profesionRecursoId: String(item.profesionRecursoId ?? ''),
          especialidadId: item.especialidadId ? String(item.especialidadId) : null }))
      : [{ ...this.crearPresentacionFirma(String(configuracion?.profesionRecursoId ??
            recursoHumano.profesionesRecurso?.[0]?._id ?? '')),
          perfilId: 'legacy', etiqueta: 'Firma principal',
          serviciosAutorizados: configuracion?.serviciosAutorizados?.length ?
            [...configuracion.serviciosAutorizados] : ['Laboratorio'], esPrincipal: true }];
    this.formFirmaLaboratorio.patchValue({
      habilitado: configuracion?.habilitado ?? false,
      predeterminadoGeneral: configuracion?.predeterminadoLaboratorio ?? false,
      referenciaAutorizacion: configuracion?.referenciaAutorizacion ?? '',
    });
    this.perfilFirmaActualId = '';
    this.seleccionarPerfilFirma(this.perfilesFirma.find((p) => p.esPrincipal)?.perfilId ??
      this.perfilesFirma[0].perfilId, false);

    // Usuario sistema: activar o desactivar grupo de login
    this.myFormRecHumano
      .get('usuarioSistema')
      ?.setValue(recursoHumano.usuarioSistema);

    const datosLogueoGroup = this.myFormRecHumano.get('datosLogueo');
    if (recursoHumano.usuarioSistema) {
      datosLogueoGroup?.enable(); // Habilita si aplica
    } else {
      datosLogueoGroup?.disable(); // Deshabilita si no aplica
    }

    this.myFormRecHumano.patchValue({
      codRecHumano: recursoHumano.codRecHumano,
      tipoDoc: recursoHumano.tipoDoc,
      nroDoc: recursoHumano.nroDoc,
      nombreRecHumano: recursoHumano.nombreRecHumano,
      apePatRecHumano: recursoHumano.apePatRecHumano,
      apeMatRecHumano: recursoHumano.apeMatRecHumano,
      fechaNacimiento: recursoHumano.fechaNacimiento,
      sexoRecHumano: recursoHumano.sexoRecHumano,
      departamentoRecHumano: recursoHumano.departamentoRecHumano,
      provinciaRecHumano: recursoHumano.provinciaRecHumano,
      distritoRecHumano: recursoHumano.distritoRecHumano,
      direcRecHumano: recursoHumano.direcRecHumano,
      mailRecHumano: recursoHumano.mailRecHumano,
      gradoInstruccion: recursoHumano.gradoInstruccion,
      atiendeConsultas: recursoHumano.atiendeConsultas,
      usuarioSistema: recursoHumano.usuarioSistema,
    });

    // Cargar valores del grupo datosLogueo si existen
    if (recursoHumano.datosLogueo) {
      datosLogueoGroup?.patchValue({
        nombreUsuario: recursoHumano.datosLogueo.nombreUsuario || '',
        correoLogin: recursoHumano.datosLogueo.correoLogin || '',
        passwordHash: recursoHumano.datosLogueo.passwordHash || '',
        rol: recursoHumano.datosLogueo.rol._id || '',
        sedeAsignada: recursoHumano.datosLogueo.sedeAsignada || '',
        estado: recursoHumano.datosLogueo.estado,
      });
    }

    // Limpiar el FormArray antes de llenarlo
    this.phones.clear();

    // Agregar cada teléfono al FormArray
    recursoHumano.phones.forEach((phone: any) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });

    this.actualizarEdad();

    this.profesionesRecurso.clear();
    // Agregar cada profesión al FormArray
    recursoHumano.profesionesRecurso.forEach(
      (profesion: any, index: number) => {
        this.profesionesRecurso.push(this.crearProfesionGroup(profesion));
        const profesionId =
          profesion.profesionRef._id || profesion.profesionRef;
        this.onProfesionSeleccionada(profesionId, index);
      },
    );
  }

  private crearTelefonoGroup(phone: any): FormGroup {
    return this._fb.group({
      phoneNumber: [phone.phoneNumber],
      descriptionPhone: [phone.descriptionPhone],
    });
  }

  private crearProfesionGroup(profesion: any): FormGroup {
    const especialidadesArray = this._fb.array([]) as FormArray;

    if (profesion.especialidades && profesion.especialidades.length > 0) {
      profesion.especialidades.forEach((esp: any) => {
        especialidadesArray.push(this.crearEspecialidadGroup(esp));
      });
    }

    return this._fb.group({
      _id: [profesion._id ?? undefined],
      profesionRef: [profesion.profesionRef],
      nivelProfesion: [profesion.nivelProfesion],
      titulo: [profesion.titulo],
      codProfesion: [profesion.codProfesion],
      nroColegiatura: [profesion.nroColegiatura],
      centroEstudiosProfesion: [profesion.centroEstudiosProfesion],
      anioEgresoProfesion: [profesion.anioEgresoProfesion],
      especialidades: especialidadesArray,
    });
  }

  private crearEspecialidadGroup(especialidad: any): FormGroup {
    return this._fb.group({
      _id: [especialidad._id ?? undefined],
      especialidadRef: [especialidad.especialidadRef],
      codEspecialidad: [especialidad.codEspecialidad],
      rne: [especialidad.rne],
      centroEstudiosEspecialidad: [especialidad.centroEstudiosEspecialidad],
      anioEgresoEspecialidad: [especialidad.anioEgresoEspecialidad],
    });
  }

  profesiones: any[] = [];
  especialidadesPorProfesion: any[][] = [];
  listarProfesiones() {
    this._profesionService.getAllProfesions().subscribe({
      next: (profesiones) => {
        this.profesiones = profesiones;
      },
      error: () => {
        this.profesiones = [];
      },
    });
  }

  onProfesionSeleccionada(idProfesion: string, index: number): void {
    this._especialidadService
      .getEspecialidadesPorProfesion(idProfesion)
      .subscribe({
        next: (especialidades) => {
          this.especialidadesPorProfesion[index] = especialidades;
          console.log('Especialidades cargadas:', especialidades);
        },
        error: (err) => {
          console.error('Error al cargar especialidades', err);
          this.especialidadesPorProfesion[index] = [];
        },
      });
  }

  private todosLosRrhh: IRecHumano[] = [];

  ultimosRecHumano(): void {
    this._recHumanoService.getLastRecHumanos(0).subscribe((recHumano) => {
      this.dataSourceRecursoHumano.data = recHumano;
      this.todosLosRrhh = recHumano; // Guardar todos los recursos humanos para futuras búsquedas
      console.log('Recursos humanos obtenidos:', recHumano);
    });
  }

  terminoBusqueda = new FormControl('');

  buscarRecHumano() {
    const termino = this.terminoBusqueda?.value?.trim() ?? '';

    if (termino === '') {
      // Si no hay término de búsqueda, mostrar todos los datos iniciales
      this.dataSourceRecursoHumano.data = this.todosLosRrhh;
      this.dataSourceRecursoHumano.filter = '';
    } else {
      // Si hay término de búsqueda, aplicar filtro del dataSource
      this.dataSourceRecursoHumano.data = this.todosLosRrhh; // Asegurar que tiene todos los datos
      this.dataSourceRecursoHumano.filter = termino.toLowerCase();
    }

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourceRecursoHumano.paginator) {
      this.dataSourceRecursoHumano.paginator.firstPage();
    }
  }

  actualizarEdad() {
    const fecha = this.myFormRecHumano.get('fechaNacimiento')?.value;
    const edadCalculada = this._fechaService.calcularEdad(fecha);
    this.myFormRecHumano.get('edad')?.setValue(edadCalculada);
  }

  recHumanoSeleccionado = false;

  registraRecHumano() {
    console.log('Registro de recurso humano iniciado');
    this.formSubmitted = true;

    if (this.myFormRecHumano.invalid) {
      console.log(
        'Formulario inválido, marcando todos los campos como tocados',
      );
      this.myFormRecHumano.markAllAsTouched();
      return;
    }

    if (!this.validarArrayTelefono()) {
      console.log('No hay teléfonos registrados, mostrando alerta');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la creación de este recuso humano?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Procede registro');
        const body: IRecHumano = this.myFormRecHumano.value;

        this._recHumanoService.registrarRecHumano(body).subscribe({
          next: (res) => {
            if (res.ok) {
              this.mostrarAlertaExito('Recurso registrado');
              this.ultimosRecHumano();
              this.nuevoRecHumano();
            } else {
              const mensaje = res.msg || 'Ocurrió un error inesperado.';
              this.mostrarAlertaError(mensaje);
            }
          },
          error: (error) => {
            const mensaje =
              error?.error?.msg || 'Error inesperado al registrar.';
            this.mostrarAlertaError(mensaje);
          },
        });
      }
    });
  }

  private mostrarAlertaExito(tipo: string): void {
    Swal.fire({
      title: 'Confirmado',
      text: tipo + ' correctamente',
      icon: 'success',
      confirmButtonText: 'Ok',
    });
  }

  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'ERROR!',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Ok',
    });
  }

  actualizarRecHumano() {
    this.formSubmitted = true;

    console.log('entro a actualizarRecHumano');
    if (this.myFormRecHumano.invalid) {
      this.myFormRecHumano.markAllAsTouched();
      return;
    }

    if (!this.validarArrayTelefono()) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la actualización de este recurso humano?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Procede actualización');
        const formValue = this.myFormRecHumano.value;

        this._recHumanoService
          .actualizarRecHumano(formValue.codRecHumano, formValue)
          .subscribe({
            next: (res) => {
              if (res.ok) {
                this.mostrarAlertaExito('actualizado');
                this.ultimosRecHumano();
                this.nuevoRecHumano();
              } else {
                const mensaje = res.msg || 'Ocurrió un error inesperado.';
                this.mostrarAlertaError(mensaje);
              }
            },
            error: (error) => {
              const mensaje =
                error?.error?.msg || 'Error inesperado al registrar.';
              this.mostrarAlertaError(mensaje);
            },
          });
      }
    });
  }

  nuevoRecHumano() {
    this.profesionalFirma = null;
    ++this.solicitudImagenFirma;
    this.imagenFirmaPreview = null;
    this.estadoImagenFirma = '';
    this.archivoFirmaPendiente = null;
    this.perfilesFirma = [];
    this.perfilFirmaActualId = '';
    this.archivosPendientesFirma.clear();
    this.previewsPendientesFirma.clear();
    this.formFirmaLaboratorio.reset({
      habilitado: false, profesionRecursoId: '', serviciosAutorizados: [],
      predeterminadoLaboratorio: false, predeterminadoGeneral: false, referenciaAutorizacion: '',
      etiqueta: '', tratamiento: '', tratamientoPersonalizado: '', especialidadId: '', mostrarProfesion: true,
      mostrarEspecialidad: true, mostrarColegiatura: true, mostrarRne: true,
      siglaColegiatura: 'Colegiatura', siglaEspecialidad: 'RNE',
    });
    this.myFormRecHumano.reset(); // Reinicia todos los campos del formulario
    this.formSubmitted = false; // Restablece el estado de validación del formulario
    this.phones.clear(); // Limpia el FormArray de teléfonos, si es necesario
    this.profesionesRecurso.clear();
    this.myFormRecHumano.patchValue({
      departamentoRecHumano: '15',
      provinciaRecHumano: '01',
      distritoRecHumano: '',
    });
    this.recHumanoSeleccionado = false;
    this.filaSeleccionadaIndex = null; // Reinicia el índice de la fila seleccionada
  }

  private suscribirseUsuarioSistema(): void {
    this.myFormRecHumano
      .get('usuarioSistema')
      ?.valueChanges.subscribe((esUsuario) => {
        const grupoLogin = this.myFormRecHumano.get('datosLogueo') as FormGroup;

        if (esUsuario) {
          // Activar campos y establecer validaciones
          grupoLogin.get('nombreUsuario')?.enable();
          grupoLogin.get('correoLogin')?.enable();
          grupoLogin.get('passwordHash')?.enable();
          grupoLogin.get('rol')?.enable();
          grupoLogin.get('sedeAsignada')?.enable();
          grupoLogin.get('estado')?.enable();

          grupoLogin.get('nombreUsuario')?.setValidators([Validators.required]);
          grupoLogin.get('passwordHash')?.setValidators([Validators.required]);
          grupoLogin.get('rol')?.setValidators([Validators.required]);
          grupoLogin.get('sedeAsignada')?.setValidators([Validators.required]);
        } else {
          // Desactivar campos y quitar validaciones
          grupoLogin.get('nombreUsuario')?.reset();
          grupoLogin.get('correoLogin')?.reset();
          grupoLogin.get('passwordHash')?.reset();
          grupoLogin.get('rol')?.reset();
          grupoLogin.get('sedeAsignada')?.reset();

          grupoLogin.get('nombreUsuario')?.clearValidators();
          grupoLogin.get('correoLogin')?.clearValidators();
          grupoLogin.get('passwordHash')?.clearValidators();
          grupoLogin.get('rol')?.clearValidators();
          grupoLogin.get('sedeAsignada')?.clearValidators();

          grupoLogin.get('nombreUsuario')?.disable();
          grupoLogin.get('correoLogin')?.disable();
          grupoLogin.get('passwordHash')?.disable();
          grupoLogin.get('rol')?.disable();
          grupoLogin.get('sedeAsignada')?.disable();
          grupoLogin.get('estado')?.disable();
        }

        // Actualiza el estado de los controles para que los errores se reflejen
        grupoLogin.get('nombreUsuario')?.updateValueAndValidity();
        grupoLogin.get('correoLogin')?.updateValueAndValidity();
        grupoLogin.get('passwordHash')?.updateValueAndValidity();
        grupoLogin.get('rol')?.updateValueAndValidity();
        grupoLogin.get('sedeAsignada')?.updateValueAndValidity();
      });
  }
}
