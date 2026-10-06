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
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

import {
  IBandejaResultadosLaboratorioItem,
  IResultadoLaboratorio,
} from '../../../models/Gestion/resultadoLaboratorio.models';
import { IEstadoOperativoSolicitud } from '../../../models/Gestion/estadoOperativoSolicitud.models';
import { ResultadoLaboratorioService } from '../../../services/gestion/resultadosLaboratorio/resultados-laboratorio.service';
import { AuthService } from '../../../services/auth/auth.service';
import {
  DialogCapturaResultadoComponent,
  IRegistroResultadoDialogResult,
} from './dialogs/dialog-captura-resultado/dialog-captura-resultado.component';

@Component({
  selector: 'app-resultados-laboratorio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginator,
    MatSnackBarModule,
    MatTableModule,
    MatTabsModule,
  ],
  providers: [
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'es-PE',
    },
  ],
  templateUrl: './resultados-laboratorio.component.html',
  styleUrl: './resultados-laboratorio.component.scss',
})
export class ResultadosLaboratorioComponent implements OnInit, AfterViewInit {
  private readonly _fb = inject(FormBuilder);

  private readonly _resultadoLaboratorioService = inject(
    ResultadoLaboratorioService,
  );

  private readonly _authService = inject(AuthService);

  readonly puedeRegistrarResultados = this._authService.tienePermisoAccion(
    'RESULTADOS_REGISTRAR',
  );

  readonly puedeValidarResultados = this._authService.tienePermisoAccion(
    'RESULTADOS_VALIDAR',
  );

  readonly puedeLiberarResultados = this._authService.tienePermisoAccion(
    'RESULTADOS_LIBERAR',
  );

  readonly puedeAnularResultados = this._authService.tienePermisoAccion(
    'RESULTADOS_ANULAR',
  );

  private readonly _snackBar = inject(MatSnackBar);

  private readonly _dialog = inject(MatDialog);

  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  readonly formBusqueda = this._fb.group({
    terminoBusqueda: [''],
    fechaInicio: [new Date()],
    fechaFin: [new Date()],
  });

  cargandoBandeja = false;
  resultadoProcesandoId: string | null = null;

  expandedParticularId: string | null = null;
  expandedEmpresaId: string | null = null;

  readonly columnasParticulares: string[] = [
    'codigoLaboratorio',
    'codigoSolicitud',
    'fechaEmision',
    'hc',
    'documento',
    'paciente',
    'estado',
    'resultados',
    'acciones',
  ];

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
    'estado',
    'resultados',
    'acciones',
  ];

  readonly columnasDetalle: string[] = [
    'prueba',
    'instancia',
    'muestra',
    'estado',
    'items',
    'alertas',
    'acciones',
  ];

  readonly dataSourceParticulares =
    new MatTableDataSource<IBandejaResultadosLaboratorioItem>([]);

  readonly dataSourceEmpresas =
    new MatTableDataSource<IBandejaResultadosLaboratorioItem>([]);

  @ViewChild('paginatorParticulares')
  paginatorParticulares!: MatPaginator;

  @ViewChild('paginatorEmpresas')
  paginatorEmpresas!: MatPaginator;

  ngOnInit(): void {
    this._adapter.setLocale('es-PE');
    this.buscarSolicitudes();
  }

  ngAfterViewInit(): void {
    this.dataSourceParticulares.paginator = this.paginatorParticulares;
    this.dataSourceEmpresas.paginator = this.paginatorEmpresas;
  }

  // ====== Buscar bandeja ======

  buscarSolicitudes(mostrarMensaje = false): void {
    const fechaInicio = this.formBusqueda.controls.fechaInicio.value;
    const fechaFin = this.formBusqueda.controls.fechaFin.value;

    if (!fechaInicio || !fechaFin) {
      this._snackBar.open('Debe indicar el rango de fechas', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    inicio.setHours(0, 0, 0, 0);
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

    const termino =
      this.formBusqueda.controls.terminoBusqueda.value?.trim() ?? '';

    this.cargandoBandeja = true;
    this.expandedParticularId = null;
    this.expandedEmpresaId = null;

    this._resultadoLaboratorioService
      .obtenerBandeja(inicio.toISOString(), fin.toISOString(), termino)
      .subscribe({
        next: (response) => {
          const solicitudes = response.solicitudes ?? [];

          this.dataSourceParticulares.data = solicitudes.filter(
            (item) => item.solicitud.origenAtencion === 'PARTICULAR',
          );

          this.dataSourceEmpresas.data = solicitudes.filter(
            (item) => item.solicitud.origenAtencion === 'EMPRESA',
          );

          this.reiniciarPaginadores();
          this.cargandoBandeja = false;

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
          console.error('Error al consultar Gestión de Resultados:', error);

          this.dataSourceParticulares.data = [];
          this.dataSourceEmpresas.data = [];
          this.cargandoBandeja = false;

          this._snackBar.open(
            error?.error?.msg ||
              'No se pudo consultar la bandeja de resultados',
            'Cerrar',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  // ====== Limpiar búsqueda ======

  limpiarBusqueda(): void {
    this.formBusqueda.reset({
      terminoBusqueda: '',
      fechaInicio: new Date(),
      fechaFin: new Date(),
    });

    this.buscarSolicitudes();
  }

  // ====== Expandir particulares ======

  isExpandedParticular(item: IBandejaResultadosLaboratorioItem): boolean {
    return this.expandedParticularId === item.solicitud._id;
  }

  toggleParticular(item: IBandejaResultadosLaboratorioItem): void {
    this.expandedParticularId = this.isExpandedParticular(item)
      ? null
      : item.solicitud._id;
  }

  // ====== Expandir empresas ======

  isExpandedEmpresa(item: IBandejaResultadosLaboratorioItem): boolean {
    return this.expandedEmpresaId === item.solicitud._id;
  }

  toggleEmpresa(item: IBandejaResultadosLaboratorioItem): void {
    this.expandedEmpresaId = this.isExpandedEmpresa(item)
      ? null
      : item.solicitud._id;
  }

  // ====== Abrir registro / consulta ======

  abrirRegistroResultado(
    row: IBandejaResultadosLaboratorioItem,
    resultado: IResultadoLaboratorio,
  ): void {
    const indiceInicial = row.resultados.detalle.findIndex(
      (item) => item._id === resultado._id,
    );

    const dialogRef = this._dialog.open(DialogCapturaResultadoComponent, {
      width: '1000px',
      maxWidth: '96vw',
      disableClose: true,
      data: {
        resultados: row.resultados.detalle,
        indiceInicial: Math.max(indiceInicial, 0),
        paciente: {
          nombreCompleto: this.obtenerNombrePaciente(row),
          documento: this.obtenerDocumentoPaciente(row),
          hc: row.solicitud.paciente.hc ?? '-',
          sexoPaciente: row.solicitud.paciente.sexoPaciente ?? null,
          fechaNacimientoPaciente:
            row.solicitud.paciente.fechaNacimientoPaciente ?? null,
        },
        fechaReferencia: row.solicitud.fechaEmision,
        soloLecturaForzada:
          row.solicitud.estado === 'ANULADO' || !this.puedeRegistrarResultados,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((salida: IRegistroResultadoDialogResult | undefined) => {
        if (!salida?.huboCambios) {
          return;
        }

        salida.resultadosActualizados.forEach((resultadoActualizado) => {
          this.aplicarActualizacionResultado(
            row,
            resultadoActualizado,
            salida.estadoSolicitud,
            salida.estadoOperativo,
          );
        });
      });
  }

  // ====== Validar resultado ======

  async validarResultado(
    row: IBandejaResultadosLaboratorioItem,
    resultado: IResultadoLaboratorio,
  ): Promise<void> {
    if (
      !this.puedeValidarResultados ||
      resultado.estadoResultado !== 'COMPLETO' ||
      this.resultadoProcesandoId
    ) {
      return;
    }

    const totalAlertas = this.obtenerTotalAlertas(resultado);
    const alertasCriticas = this.obtenerAlertasCriticas(resultado);

    let observacionValidacion = '';
    let confirmarAlertasCriticas = false;

    if (alertasCriticas > 0) {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: 'Resultado con alerta crítica',
        html: `
          <div style="text-align:left">
            <p>La prueba <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong> posee <strong>${alertasCriticas}</strong> alerta(s) CRÍTICA(s).</p>
            <p>Revise los valores antes de validar.</p>
            <textarea id="observacion-validacion" class="swal2-textarea" placeholder="Observación de validación (opcional)"></textarea>
            <label style="display:flex; gap:8px; align-items:flex-start; margin-top:12px">
              <input id="confirmar-alertas-criticas" type="checkbox" style="margin-top:4px" />
              <span>Confirmo que revisé las alertas críticas y los valores ingresados.</span>
            </label>
          </div>
        `,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Validar resultado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#7e22ce',
        preConfirm: () => {
          const observacion = document.querySelector<HTMLTextAreaElement>(
            '#observacion-validacion',
          );
          const confirmacionCritica = document.querySelector<HTMLInputElement>(
            '#confirmar-alertas-criticas',
          );

          if (!confirmacionCritica?.checked) {
            Swal.showValidationMessage(
              'Debe confirmar explícitamente la revisión de las alertas críticas.',
            );
            return false;
          }

          return {
            observacionValidacion: observacion?.value?.trim() ?? '',
            confirmarAlertasCriticas: true,
          };
        },
      });

      if (!confirmacion.isConfirmed || !confirmacion.value) {
        return;
      }

      observacionValidacion = confirmacion.value.observacionValidacion;
      confirmarAlertasCriticas = true;
    } else {
      const confirmacion = await Swal.fire({
        icon: totalAlertas > 0 ? 'warning' : 'question',
        title: '¿Validar resultado?',
        html:
          totalAlertas > 0
            ? `La prueba <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong> posee <strong>${totalAlertas}</strong> alerta(s) detectada(s). Revise los valores antes de continuar.`
            : `Se validará <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong>.`,
        input: 'textarea',
        inputLabel: 'Observación de validación (opcional)',
        inputPlaceholder: 'Ingrese una observación si corresponde',
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Validar resultado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#7e22ce',
      });

      if (!confirmacion.isConfirmed) {
        return;
      }

      observacionValidacion = String(confirmacion.value ?? '').trim();
    }

    this.resultadoProcesandoId = resultado._id;

    try {
      const response = await firstValueFrom(
        this._resultadoLaboratorioService.validarResultado(resultado._id, {
          observacionValidacion,
          confirmarAlertasCriticas,
        }),
      );

      this.aplicarActualizacionResultado(
        row,
        {
          ...response.resultado,
          estadoUnidadLaboratorio: response.estadoUnidadLaboratorio,
        },
        response.estadoSolicitud,
        response.estadoOperativo,
      );

      await Swal.fire({
        icon: response.resumenAlertas.criticas > 0 ? 'warning' : 'success',
        title: 'Resultado validado',
        text: response.msg,
        confirmButtonText: 'Continuar',
      });
    } catch (error: any) {
      console.error('Error al validar resultado:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo validar el resultado',
        text:
          error?.error?.msg ||
          'Ocurrió un error al validar el resultado de laboratorio.',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.resultadoProcesandoId = null;
    }
  }

  // ====== Liberar resultado ======

  async liberarResultado(
    row: IBandejaResultadosLaboratorioItem,
    resultado: IResultadoLaboratorio,
  ): Promise<void> {
    if (
      !this.puedeLiberarResultados ||
      resultado.estadoResultado !== 'VALIDADO' ||
      this.resultadoProcesandoId
    ) {
      return;
    }

    const totalAlertas = this.obtenerTotalAlertas(resultado);
    const alertasCriticas = this.obtenerAlertasCriticas(resultado);
    let confirmarAlertasCriticas = false;

    const confirmacion = await Swal.fire({
      icon: totalAlertas > 0 ? 'warning' : 'question',
      title:
        alertasCriticas > 0
          ? 'Liberación con alerta crítica'
          : '¿Liberar resultado?',
      html: `
        <div style="text-align:left">
          <p>El resultado de <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong> quedará disponible para visualización o entrega.</p>
          ${
            totalAlertas > 0
              ? `<p>La prueba posee <strong>${totalAlertas}</strong> alerta(s) clínica(s), de las cuales <strong>${alertasCriticas}</strong> son críticas.</p>`
              : ''
          }
          ${
            alertasCriticas > 0
              ? `<label style="display:flex; gap:8px; align-items:flex-start; margin-top:12px"><input id="confirmar-liberacion-critica" type="checkbox" style="margin-top:4px" /><span>Confirmo que revisé las alertas críticas antes de liberar el resultado.</span></label>`
              : ''
          }
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Liberar resultado',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d',
      preConfirm: () => {
        if (alertasCriticas <= 0) {
          return true;
        }

        const confirmacionCritica = document.querySelector<HTMLInputElement>(
          '#confirmar-liberacion-critica',
        );

        if (!confirmacionCritica?.checked) {
          Swal.showValidationMessage(
            'Debe confirmar explícitamente la revisión de las alertas críticas.',
          );
          return false;
        }

        return true;
      },
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    confirmarAlertasCriticas = alertasCriticas > 0;
    this.resultadoProcesandoId = resultado._id;

    try {
      const response = await firstValueFrom(
        this._resultadoLaboratorioService.liberarResultado(resultado._id, {
          confirmarAlertasCriticas,
        }),
      );

      this.aplicarActualizacionResultado(
        row,
        {
          ...response.resultado,
          estadoUnidadLaboratorio: response.estadoUnidadLaboratorio,
        },
        response.estadoSolicitud,
        response.estadoOperativo,
      );

      await Swal.fire({
        icon: response.resumenAlertas.criticas > 0 ? 'warning' : 'success',
        title: 'Resultado liberado',
        text: response.msg,
        confirmButtonText: 'Continuar',
      });
    } catch (error: any) {
      console.error('Error al liberar resultado:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo liberar el resultado',
        text:
          error?.error?.msg ||
          'Ocurrió un error al liberar el resultado de laboratorio.',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.resultadoProcesandoId = null;
    }
  }

  // ====== Anular resultado ======

  async anularResultado(
    row: IBandejaResultadosLaboratorioItem,
    resultado: IResultadoLaboratorio,
  ): Promise<void> {
    if (
      !this.puedeAnularResultados ||
      resultado.estadoResultado === 'ANULADO' ||
      this.resultadoProcesandoId
    ) {
      return;
    }

    const requiereSegundoUsuario = resultado.estadoResultado === 'LIBERADO';
    let motivoAnulacion = '';
    let nombreUsuarioAutorizador: string | undefined;
    let passwordAutorizador: string | undefined;

    if (requiereSegundoUsuario) {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: 'Anular resultado liberado',
        html: `
          <div style="text-align:left">
            <p>La prueba <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong> ya fue LIBERADA y pudo haber sido entregada.</p>
            <p>Esta acción requiere autorización de un segundo usuario con permiso de anulación.</p>
            <textarea id="motivo-anulacion" class="swal2-textarea" placeholder="Motivo obligatorio"></textarea>
            <input id="usuario-autorizador" class="swal2-input" placeholder="Usuario autorizador" autocomplete="off" />
            <input id="password-autorizador" class="swal2-input" type="password" placeholder="Contraseña autorizador" autocomplete="new-password" />
          </div>
        `,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Anular resultado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#b91c1c',
        preConfirm: () => {
          const motivo = document.querySelector<HTMLTextAreaElement>(
            '#motivo-anulacion',
          )?.value?.trim();
          const usuario = document.querySelector<HTMLInputElement>(
            '#usuario-autorizador',
          )?.value?.trim();
          const password = document.querySelector<HTMLInputElement>(
            '#password-autorizador',
          )?.value;

          if (!motivo || !usuario || !password) {
            Swal.showValidationMessage(
              'Motivo, usuario autorizador y contraseña son obligatorios.',
            );
            return false;
          }

          return { motivo, usuario, password };
        },
      });

      if (!confirmacion.isConfirmed || !confirmacion.value) {
        return;
      }

      motivoAnulacion = confirmacion.value.motivo;
      nombreUsuarioAutorizador = confirmacion.value.usuario;
      passwordAutorizador = confirmacion.value.password;
    } else {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: '¿Anular resultado?',
        html: `Se anulará <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong>. El resultado permanecerá visible en el historial.`,
        input: 'textarea',
        inputLabel: 'Motivo de anulación',
        inputPlaceholder: 'Indique el motivo de la anulación',
        inputValidator: (value) =>
          String(value ?? '').trim()
            ? null
            : 'El motivo de anulación es obligatorio',
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Anular resultado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#b91c1c',
      });

      if (!confirmacion.isConfirmed) {
        return;
      }

      motivoAnulacion = String(confirmacion.value ?? '').trim();
    }

    this.resultadoProcesandoId = resultado._id;

    try {
      const response = await firstValueFrom(
        this._resultadoLaboratorioService.anularResultado(resultado._id, {
          motivoAnulacion,
          ...(nombreUsuarioAutorizador
            ? { nombreUsuarioAutorizador }
            : {}),
          ...(passwordAutorizador ? { passwordAutorizador } : {}),
        }),
      );

      this.aplicarActualizacionResultado(
        row,
        {
          ...response.resultado,
          estadoUnidadLaboratorio: response.estadoUnidadLaboratorio,
        },
        response.estadoSolicitud,
        response.estadoOperativo,
      );

      await Swal.fire({
        icon: 'success',
        title: 'Resultado anulado',
        text: response.msg,
        confirmButtonText: 'Continuar',
      });
    } catch (error: any) {
      console.error('Error al anular resultado:', error);

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo anular el resultado',
        text:
          error?.error?.msg ||
          'Ocurrió un error al anular el resultado de laboratorio.',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.resultadoProcesandoId = null;
    }
  }

  // ====== Estado de acciones ======

  esResultadoEditable(resultado: IResultadoLaboratorio): boolean {
    return ['PENDIENTE', 'EN PROCESO', 'COMPLETO'].includes(
      resultado.estadoResultado,
    );
  }

  estaProcesandoResultado(resultado: IResultadoLaboratorio): boolean {
    return this.resultadoProcesandoId === resultado._id;
  }

  obtenerTextoAccionResultado(resultado: IResultadoLaboratorio): string {
    if (!this.esResultadoEditable(resultado) || !this.puedeRegistrarResultados) {
      return 'Ver';
    }

    return resultado.estadoResultado === 'PENDIENTE' ? 'Registrar' : 'Editar';
  }

  // ====== Actualizar fila en memoria ======

  private aplicarActualizacionResultado(
    row: IBandejaResultadosLaboratorioItem,
    resultadoActualizado: IResultadoLaboratorio,
    estadoSolicitud: string,
    estadoOperativo: IEstadoOperativoSolicitud,
  ): void {
    row.resultados.detalle = row.resultados.detalle.map((resultado) => {
      if (resultado._id !== resultadoActualizado._id) {
        return resultado;
      }

      return {
        ...resultado,
        ...resultadoActualizado,
        habilitacionMuestra:
          resultadoActualizado.habilitacionMuestra ??
          resultado.habilitacionMuestra,
        estadoUnidadLaboratorio:
          resultadoActualizado.estadoUnidadLaboratorio ??
          resultado.estadoUnidadLaboratorio,
      };
    });

    row.resultados.totalDocumentos = row.resultados.detalle.length;
    row.resultados.inicializados = row.resultados.detalle.length > 0;
    row.resultados.resumen =
      estadoOperativo.resumen?.resultados ?? row.resultados.resumen;

    row.solicitud.estado = estadoSolicitud;
    row.solicitud.estadoOperativo = estadoOperativo;

    this.dataSourceParticulares.data = [...this.dataSourceParticulares.data];
    this.dataSourceEmpresas.data = [...this.dataSourceEmpresas.data];
  }

  // ====== Datos visibles ======

  obtenerNombrePaciente(item: IBandejaResultadosLaboratorioItem): string {
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

  obtenerDocumentoPaciente(item: IBandejaResultadosLaboratorioItem): string {
    const paciente = item.solicitud.paciente;

    return [paciente.tipoDoc, paciente.nroDoc].filter(Boolean).join(' ');
  }

  obtenerClaseEstadoPrincipal(estado: string): string {
    switch (estado) {
      case 'ATENDIDO':
        return 'estado-chip estado-atendido';

      case 'ANULADO':
        return 'estado-chip estado-anulado';

      case 'EN PROCESO':
        return 'estado-chip estado-en-proceso';

      default:
        return 'estado-chip estado-generado';
    }
  }

  obtenerClaseEstadoOperativo(codigo: string): string {
    if (codigo === 'PENDIENTE_MUESTRAS') {
      return 'estado-operativo estado-operativo-pendiente';
    }

    if (codigo === 'RESULTADOS_DISPONIBLES_PARCIALMENTE') {
      return 'estado-operativo estado-operativo-disponible';
    }

    if (codigo === 'RESULTADOS_LIBERADOS') {
      return 'estado-operativo estado-operativo-liberado';
    }

    return 'estado-operativo';
  }

  obtenerClaseEstadoResultado(estado: string): string {
    switch (estado) {
      case 'EN PROCESO':
        return 'estado-chip resultado-en-proceso';

      case 'COMPLETO':
        return 'estado-chip resultado-completo';

      case 'VALIDADO':
        return 'estado-chip resultado-validado';

      case 'LIBERADO':
        return 'estado-chip resultado-liberado';

      case 'ANULADO':
        return 'estado-chip estado-anulado';

      default:
        return 'estado-chip resultado-pendiente';
    }
  }

  obtenerTextoDisponibilidad(item: IBandejaResultadosLaboratorioItem): string {
    const resumen = item.resultados.resumen;

    if (!resumen) {
      return 'Sin resumen';
    }

    return `${resumen.disponibles} de ${resumen.total} disponibles`;
  }

  obtenerItemsRegistrados(resultado: IResultadoLaboratorio): number {
    return (resultado.resultadosItems ?? []).filter(
      (item) => item.estado !== 'PENDIENTE',
    ).length;
  }

  obtenerTotalAlertas(resultado: IResultadoLaboratorio): number {
    return (resultado.resultadosItems ?? []).reduce(
      (total, item) => total + (item.alertasDetectadas?.length ?? 0),
      0,
    );
  }

  obtenerAlertasCriticas(resultado: IResultadoLaboratorio): number {
    return (resultado.resultadosItems ?? []).reduce(
      (total, item) =>
        total +
        (item.alertasDetectadas ?? []).filter(
          (alerta) => alerta.nivelAlerta === 'CRITICA',
        ).length,
      0,
    );
  }

  obtenerEstadoMuestraResultado(resultado: IResultadoLaboratorio): string {
    const habilitacion = resultado.habilitacionMuestra;

    if (!habilitacion) {
      return '-';
    }

    if (!habilitacion.requiereMuestra) {
      return 'No requiere muestra';
    }

    if (habilitacion.habilitada) {
      return 'Muestra apta';
    }

    return habilitacion.mensaje;
  }

  private reiniciarPaginadores(): void {
    this.paginatorParticulares?.firstPage();
    this.paginatorEmpresas?.firstPage();
  }
}
