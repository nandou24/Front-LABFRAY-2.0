import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  IBandejaTomaMuestrasItem,
  IEmpresaBandejaMuestra,
  OrigenAtencionBandejaMuestra,
} from '../../../models/Gestion/muestraLaboratorio.models';

import { MuestraLaboratorioService } from '../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import { DialogGestionarTomaComponent } from './dialogs/dialog-gestionar-toma/dialog-gestionar-toma.component';
import { DialogRecepcionMasivaComponent } from './dialogs/dialog-recepcion-masiva/dialog-recepcion-masiva.component';
import { DialogAceptacionMasivaComponent } from './dialogs/dialog-aceptacion-masiva/dialog-aceptacion-masiva.component';
import { DialogRecoleccionMasivaComponent } from './dialogs/dialog-recoleccion-masiva/dialog-recoleccion-masiva.component';

@Component({
  selector: 'app-toma-muestras',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginator,
    MatTableModule,
    MatTabsModule,
    MatDialogModule,
  ],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'es-PE',
    },
  ],
  templateUrl: './toma-muestras.component.html',
  styleUrl: './toma-muestras.component.scss',
})
export class TomaMuestrasComponent implements OnInit, AfterViewInit {
  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  private readonly _snackBar = inject(MatSnackBar);

  private readonly _dialog = inject(MatDialog);

  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  // ====== Búsqueda ======

  readonly formBusqueda = this._fb.group({
    terminoBusqueda: [''],

    fechaInicio: [new Date()],

    fechaFin: [new Date()],

    filtroResultados: [''],
  });

  cargando = false;
  inicializandoSolicitudId: string | null = null;

  // ====== Particulares ======

  readonly columnasParticulares: string[] = [
    'codigoLaboratorio',
    'codigoSolicitud',
    'fechaEmision',
    'hc',
    'documento',
    'paciente',
    'estado',
  ];

  readonly columnasParticularesConExpand: string[] = [
    ...this.columnasParticulares,
    'expand',
  ];

  readonly dataSourceParticulares =
    new MatTableDataSource<IBandejaTomaMuestrasItem>([]);

  expandedParticular: IBandejaTomaMuestrasItem | null = null;

  @ViewChild('paginatorParticulares')
  paginatorParticulares!: MatPaginator;

  // ====== Empresas ======

  readonly columnasEmpresas: string[] = [
    'codigoLaboratorio',
    'codigoSolicitud',
    'codigoProgramacion',
    'fechaEmision',
    'hc',
    'documento',
    'paciente',
    'empresa',
    'sede',
    'prioridad',
    'estado',
  ];

  readonly columnasEmpresasConExpand: string[] = [
    ...this.columnasEmpresas,
    'expand',
  ];

  readonly dataSourceEmpresas =
    new MatTableDataSource<IBandejaTomaMuestrasItem>([]);

  expandedEmpresa: IBandejaTomaMuestrasItem | null = null;

  @ViewChild('paginatorEmpresas')
  paginatorEmpresas!: MatPaginator;

  // ====== Ciclo de vida ======

  ngOnInit(): void {
    this._adapter.setLocale('es-PE');

    this.configurarFiltros();

    this.buscarSolicitudes();
  }

  ngAfterViewInit(): void {
    this.dataSourceParticulares.paginator = this.paginatorParticulares;

    this.dataSourceEmpresas.paginator = this.paginatorEmpresas;
  }

  // ====== Buscar solicitudes ======

  buscarSolicitudes(
    solicitudExpandirId: string | null = null,
    mostrarMensaje = true,
  ): void {
    const fechaInicio = this.formBusqueda.controls.fechaInicio.value;

    const fechaFin = this.formBusqueda.controls.fechaFin.value;

    const termino =
      this.formBusqueda.controls.terminoBusqueda.value?.trim() ?? '';

    if (!fechaInicio || !fechaFin) {
      this._snackBar.open('Debe indicar el rango de fechas', 'Cerrar', {
        duration: 3000,
      });

      return;
    }

    const inicio = new Date(fechaInicio);

    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);

    fin.setHours(23, 59, 59, 999);

    if (inicio.getTime() > fin.getTime()) {
      this._snackBar.open(
        'La fecha de inicio no puede ser mayor que la fecha fin',
        'Cerrar',
        {
          duration: 3000,
        },
      );

      return;
    }

    this.cargando = true;

    this._muestraLaboratorioService
      .obtenerBandeja(inicio.toISOString(), fin.toISOString(), termino)
      .subscribe({
        next: (response) => {
          const solicitudes = response.solicitudes ?? [];

          // ====== Particulares ======

          this.dataSourceParticulares.data = solicitudes.filter(
            (item) => item.solicitud.origenAtencion === 'PARTICULAR',
          );

          // ====== Empresas ======

          this.dataSourceEmpresas.data = solicitudes.filter(
            (item) => item.solicitud.origenAtencion === 'EMPRESA',
          );

          this.reiniciarPaginadores();

          this.aplicarFiltroActual();

          // ====== Restaurar fila expandida ======

          if (solicitudExpandirId) {
            const particular = this.dataSourceParticulares.data.find(
              (item) => item.solicitud._id === solicitudExpandirId,
            );

            const empresa = this.dataSourceEmpresas.data.find(
              (item) => item.solicitud._id === solicitudExpandirId,
            );

            this.expandedParticular = particular ?? null;

            this.expandedEmpresa = empresa ?? null;
          }

          this.cargando = false;

          if (mostrarMensaje) {
            this._snackBar.open(
              `Se encontraron ${response.resumen.totalSolicitudes} solicitudes de laboratorio`,
              'Cerrar',
              {
                duration: 2500,
              },
            );
          }
        },

        error: (error) => {
          console.error(
            'Error al consultar bandeja de toma de muestras:',
            error,
          );

          this.dataSourceParticulares.data = [];

          this.dataSourceEmpresas.data = [];

          this.expandedParticular = null;

          this.expandedEmpresa = null;

          this.cargando = false;

          const mensaje =
            error?.error?.msg ||
            'No se pudo consultar la bandeja de toma de muestras';

          this._snackBar.open(mensaje, 'Cerrar', {
            duration: 4000,
          });
        },
      });
  }

  // ====== Configurar filtro local ======

  private configurarFiltros(): void {
    this.dataSourceParticulares.filterPredicate = (
      item: IBandejaTomaMuestrasItem,
      filtro: string,
    ) => this.coincideFiltro(item, filtro);

    this.dataSourceEmpresas.filterPredicate = (
      item: IBandejaTomaMuestrasItem,
      filtro: string,
    ) => this.coincideFiltro(item, filtro);

    this.formBusqueda.controls.filtroResultados.valueChanges.subscribe(() => {
      this.aplicarFiltroActual();
    });
  }

  // ====== Aplicar filtro ======

  private aplicarFiltroActual(): void {
    const filtro =
      this.formBusqueda.controls.filtroResultados.value?.trim().toLowerCase() ??
      '';

    this.dataSourceParticulares.filter = filtro;

    this.dataSourceEmpresas.filter = filtro;

    this.expandedParticular = null;

    this.expandedEmpresa = null;

    this.paginatorParticulares?.firstPage();

    this.paginatorEmpresas?.firstPage();
  }

  // ====== Evaluar filtro ======

  private coincideFiltro(
    item: IBandejaTomaMuestrasItem,
    filtro: string,
  ): boolean {
    if (!filtro) {
      return true;
    }

    const solicitud = item.solicitud;

    const paciente = solicitud.paciente;

    const particular = solicitud.particular;

    const empresa = solicitud.empresa;

    const servicios = solicitud.servicios ?? [];

    const planToma = item.muestras.planToma;

    const gruposRecipientes = planToma?.gruposRecipientes ?? [];

    const valores = [
      solicitud.codigoLaboratorio,
      solicitud.codSolicitud,
      solicitud.estado,
      solicitud.estadoOperativo?.descripcion,

      paciente.hc,
      paciente.tipoDoc,
      paciente.nroDoc,
      paciente.nombreCliente,
      paciente.apePatCliente,
      paciente.apeMatCliente,

      particular?.codCotizacion,
      particular?.codPago,

      empresa?.codProgramacion,
      empresa?.rucEmpresa,
      empresa?.razonSocialEmpresa,
      empresa?.codProtocolo,
      empresa?.nombreProtocolo,
      empresa?.sede,
      empresa?.tipoEvaluacion,
      empresa?.tipoAtencion,
      empresa?.prioridad,
      empresa?.estadoProgramacion,

      ...servicios.flatMap((servicio) => [
        servicio.codServicio,
        servicio.nombreServicio,
        servicio.estado,
      ]),

      planToma?.mensaje,

      ...gruposRecipientes.flatMap((grupo) => [
        grupo.tipo,
        grupo.cantidad,

        ...grupo.opciones.flatMap((opcion) => [
          opcion.tipoMuestra.codTipoMuestra,

          opcion.tipoMuestra.nombreTipoMuestra,

          opcion.tuboEnvase.codTuboEnvase,

          opcion.tuboEnvase.nombreTuboEnvase,

          opcion.tuboEnvase.color,

          opcion.tuboEnvase.aditivo,
        ]),
      ]),
    ];

    return valores.some((valor) =>
      String(valor ?? '')
        .toLowerCase()
        .includes(filtro),
    );
  }

  // ====== Reiniciar paginadores ======

  private reiniciarPaginadores(): void {
    this.paginatorParticulares?.firstPage();

    this.paginatorEmpresas?.firstPage();
  }

  // ====== Limpiar búsqueda ======

  limpiarBusqueda(): void {
    const hoy = new Date();

    this.formBusqueda.reset({
      terminoBusqueda: '',
      fechaInicio: hoy,
      fechaFin: hoy,
      filtroResultados: '',
    });

    this.buscarSolicitudes();
  }

  // ====== Expandir particular ======

  isExpandedParticular(item: IBandejaTomaMuestrasItem): boolean {
    return this.expandedParticular?.solicitud._id === item.solicitud._id;
  }

  toggleParticular(item: IBandejaTomaMuestrasItem): void {
    if (this.isExpandedParticular(item)) {
      this.expandedParticular = null;
      return;
    }

    this.expandedParticular = item;
    this.asegurarInicializacionAutomatica(item);
  }

  // ====== Expandir empresa ======

  isExpandedEmpresa(item: IBandejaTomaMuestrasItem): boolean {
    return this.expandedEmpresa?.solicitud._id === item.solicitud._id;
  }

  toggleEmpresa(item: IBandejaTomaMuestrasItem): void {
    if (this.isExpandedEmpresa(item)) {
      this.expandedEmpresa = null;
      return;
    }

    this.expandedEmpresa = item;
    this.asegurarInicializacionAutomatica(item);
  }

  // ====== Abrir recolección masiva ======

  abrirRecoleccionMasiva(
    origenAtencion: OrigenAtencionBandejaMuestra,
  ): void {
    const fechaInicio = this.formBusqueda.controls.fechaInicio.value;

    const fechaFin = this.formBusqueda.controls.fechaFin.value;

    if (!fechaInicio || !fechaFin) {
      this._snackBar.open('Debe indicar el rango de fechas', 'Cerrar', {
        duration: 3000,
      });

      return;
    }

    const inicio = new Date(fechaInicio);

    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);

    fin.setHours(23, 59, 59, 999);

    if (inicio.getTime() > fin.getTime()) {
      this._snackBar.open(
        'La fecha de inicio no puede ser mayor que la fecha fin',
        'Cerrar',
        {
          duration: 3000,
        },
      );

      return;
    }

    const dialogRef = this._dialog.open(DialogRecoleccionMasivaComponent, {
      width: '1240px',
      maxWidth: '97vw',
      maxHeight: '92vh',
      autoFocus: false,
      data: {
        origenAtencion,
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      },
    });

    dialogRef.afterClosed().subscribe(
      (actualizarBandeja: boolean | undefined) => {
        if (actualizarBandeja === true) {
          this.buscarSolicitudes(null, false);
        }
      },
    );
  }

  // ====== Abrir recepción masiva ======

  abrirRecepcionMasiva(origenAtencion: OrigenAtencionBandejaMuestra): void {
    const fechaInicio = this.formBusqueda.controls.fechaInicio.value;

    const fechaFin = this.formBusqueda.controls.fechaFin.value;

    if (!fechaInicio || !fechaFin) {
      this._snackBar.open('Debe indicar el rango de fechas', 'Cerrar', {
        duration: 3000,
      });

      return;
    }

    const inicio = new Date(fechaInicio);

    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);

    fin.setHours(23, 59, 59, 999);

    if (inicio.getTime() > fin.getTime()) {
      this._snackBar.open(
        'La fecha de inicio no puede ser mayor que la fecha fin',
        'Cerrar',
        {
          duration: 3000,
        },
      );

      return;
    }

    const dialogRef = this._dialog.open(DialogRecepcionMasivaComponent, {
      width: '1180px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      data: {
        origenAtencion,
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      },
    });

    dialogRef.afterClosed().subscribe((actualizarBandeja: boolean | undefined) => {
      if (actualizarBandeja === true) {
        this.buscarSolicitudes(null, false);
      }
    });
  }

  // ====== Abrir aceptación masiva ======

  abrirAceptacionMasiva(origenAtencion: OrigenAtencionBandejaMuestra): void {
    const fechaInicio = this.formBusqueda.controls.fechaInicio.value;

    const fechaFin = this.formBusqueda.controls.fechaFin.value;

    if (!fechaInicio || !fechaFin) {
      this._snackBar.open('Debe indicar el rango de fechas', 'Cerrar', {
        duration: 3000,
      });

      return;
    }

    const inicio = new Date(fechaInicio);

    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);

    fin.setHours(23, 59, 59, 999);

    if (inicio.getTime() > fin.getTime()) {
      this._snackBar.open(
        'La fecha de inicio no puede ser mayor que la fecha fin',
        'Cerrar',
        {
          duration: 3000,
        },
      );

      return;
    }

    const dialogRef = this._dialog.open(DialogAceptacionMasivaComponent, {
      width: '1180px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      data: {
        origenAtencion,
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      },
    });

    dialogRef.afterClosed().subscribe((actualizarBandeja: boolean | undefined) => {
      if (actualizarBandeja === true) {
        this.buscarSolicitudes(null, false);
      }
    });
  }

  // ====== Gestionar toma ======

  abrirGestionToma(item: IBandejaTomaMuestrasItem): void {
    const dialogRef = this._dialog.open(DialogGestionarTomaComponent, {
      width: '1100px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        item,
      },
    });

    dialogRef.afterClosed().subscribe((actualizarBandeja: boolean | undefined) => {
      if (actualizarBandeja === true) {
        this.buscarSolicitudes(item.solicitud._id, false);
      }
    });
  }

  // ====== Inicialización automática ======

  private asegurarInicializacionAutomatica(
    item: IBandejaTomaMuestrasItem,
  ): void {
    const solicitud = item.solicitud;
    const muestras = item.muestras;

    if (
      muestras.inicializadas ||
      !muestras.requiereMuestra ||
      !muestras.puedeInicializar ||
      !muestras.planToma.disponible ||
      this.inicializandoSolicitudId === solicitud._id
    ) {
      return;
    }

    this.inicializandoSolicitudId = solicitud._id;

    this._muestraLaboratorioService
      .inicializarMuestras(solicitud._id)
      .subscribe({
        next: () => {
          this.inicializandoSolicitudId = null;

          // ====== Mantener expansión actual ======

          const sigueExpandida =
            this.expandedParticular?.solicitud._id === solicitud._id ||
            this.expandedEmpresa?.solicitud._id === solicitud._id;

          this.buscarSolicitudes(
            sigueExpandida ? solicitud._id : null,
            false,
          );
        },

        error: (error) => {
          this.inicializandoSolicitudId = null;

          console.error('Error al preparar automáticamente la toma:', error);

          const mensaje =
            error?.error?.msg ||
            'No se pudo preparar automáticamente el plan de toma';

          this._snackBar.open(mensaje, 'Cerrar', {
            duration: 4500,
          });
        },
      });
  }

  // ====== Estado general ======

  obtenerEstadoGeneralToma(item: IBandejaTomaMuestrasItem): string {
    const muestras = item.muestras;

    if (!muestras.requiereMuestra) {
      return 'NO REQUIERE MUESTRA';
    }

    if (!muestras.planToma.disponible) {
      return 'PLAN NO DISPONIBLE';
    }

    if (!muestras.inicializadas) {
      return this.inicializandoSolicitudId === item.solicitud._id
        ? 'PREPARANDO PLAN'
        : 'PENDIENTE';
    }

    const vigentes = muestras.resumen.vigentes;

    const recipientesPlanificados =
      muestras.resumen.recipientesPlanificados;

    // ====== Detectar anulaciones del muestreo ======

    if (vigentes.total < recipientesPlanificados) {
      return vigentes.total === 0
        ? 'MUESTREO ANULADO'
        : 'CON MUESTRA ANULADA';
    }

    if (vigentes.rechazadas > 0) {
      return 'CON INCIDENCIA';
    }

    if (vigentes.aceptadas === vigentes.total) {
      return 'ACEPTADA';
    }

    if (vigentes.recepcionadas === vigentes.total) {
      return 'RECEPCIONADA';
    }

    if (vigentes.recolectadas === vigentes.total) {
      return 'RECOLECTADA';
    }

    if (vigentes.pendientes === vigentes.total) {
      return 'PENDIENTE';
    }

    return 'EN PROCESO';
  }


  // ====== Estilo del estado operativo ======

  obtenerEstiloEstadoGeneralToma(
    item: IBandejaTomaMuestrasItem,
  ): Record<string, string> {
    const estado = this.obtenerEstadoGeneralToma(item);

    const estilos: Record<string, Record<string, string>> = {
      'NO REQUIERE MUESTRA': {
        background: '#f1f5f9',
        color: '#475569',
        borderColor: '#cbd5e1',
      },
      'PLAN NO DISPONIBLE': {
        background: '#f8fafc',
        color: '#475569',
        borderColor: '#cbd5e1',
      },
      'PREPARANDO PLAN': {
        background: '#eff6ff',
        color: '#1d4ed8',
        borderColor: '#93c5fd',
      },
      'MUESTREO ANULADO': {
        background: '#f1f5f9',
        color: '#475569',
        borderColor: '#94a3b8',
      },
      'CON MUESTRA ANULADA': {
        background: '#fff7ed',
        color: '#c2410c',
        borderColor: '#fdba74',
      },
      'CON INCIDENCIA': {
        background: '#fef2f2',
        color: '#b91c1c',
        borderColor: '#fca5a5',
      },
      ACEPTADA: {
        background: '#f0fdf4',
        color: '#166534',
        borderColor: '#86efac',
      },
      RECEPCIONADA: {
        background: '#eff6ff',
        color: '#1d4ed8',
        borderColor: '#93c5fd',
      },
      RECOLECTADA: {
        background: '#ecfeff',
        color: '#155e75',
        borderColor: '#67e8f9',
      },
      PENDIENTE: {
        background: '#fffbeb',
        color: '#92400e',
        borderColor: '#fcd34d',
      },
      'EN PROCESO': {
        background: '#faf5ff',
        color: '#7e22ce',
        borderColor: '#d8b4fe',
      },
    };

    return (
      estilos[estado] ?? {
        background: '#f8fafc',
        color: '#334155',
        borderColor: '#cbd5e1',
      }
    );
  }

  // ====== Color de estado de solicitud ======

  obtenerClaseEstadoSolicitud(estado: string): string {
    switch (estado) {
      case 'EN PROCESO':
        return 'estado-chip estado-en-proceso';

      case 'ATENDIDO':
        return 'estado-chip estado-atendido';

      case 'ANULADO':
        return 'estado-chip estado-anulado';

      default:
        return 'estado-chip estado-generado';
    }
  }

  // ====== Color visual de recipiente ======

  resolverColorRecipiente(color: string | null | undefined): string {
    const colorNormalizado = String(color ?? '')
      .trim()
      .toUpperCase();

    const colores: Record<string, string> = {
      AMARILLO: '#facc15',
      LILA: '#a78bfa',
      MORADO: '#9333ea',
      ROJO: '#ef4444',
      AZUL: '#3b82f6',
      VERDE: '#22c55e',
      GRIS: '#9ca3af',
      NEGRO: '#1f2937',
      BLANCO: '#f8fafc',
      CELESTE: '#38bdf8',
      NARANJA: '#f97316',
      ROSADO: '#f472b6',
    };

    return colores[colorNormalizado] ?? '#cbd5e1';
  }

  // ====== Datos empresa ======

  obtenerEmpresa(
    item: IBandejaTomaMuestrasItem,
  ): IEmpresaBandejaMuestra | null {
    return item.solicitud.empresa;
  }

  // ====== Nombre paciente ======

  obtenerNombrePaciente(item: IBandejaTomaMuestrasItem): string {
    const paciente = item.solicitud.paciente;

    return [
      paciente.apePatCliente,
      paciente.apeMatCliente,
      paciente.nombreCliente,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  // ====== Documento paciente ======

  obtenerDocumentoPaciente(item: IBandejaTomaMuestrasItem): string {
    const paciente = item.solicitud.paciente;

    return [paciente.tipoDoc, paciente.nroDoc].filter(Boolean).join(' ');
  }

  // ====== HC paciente ======

  obtenerHcPaciente(item: IBandejaTomaMuestrasItem): string {
    return item.solicitud.paciente.hc || '-';
  }
}
