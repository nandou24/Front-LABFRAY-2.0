import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, DateAdapter, NativeDateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';
import * as XLSX from 'xlsx';
import { concatMap, from, tap, toArray } from 'rxjs';
import Swal from 'sweetalert2';
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import { ProgramacionEmpresaService } from '../../../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';
import { IFilaValidacionImportacion, IResultadoValidacionImportacion, IValidacionMasivaProgramacionesResponse, IFilaRegistroImportacion, IResultadoRegistroImportacion, IRespuestaRegistroImportacion } from '../../../../../../models/Gestion/programacionEmpresa.models';
import { IEmpresa, IProtocoloEmpresa } from '../../../../../../models/Mantenimiento/empresa.models';
import { PLANTILLA_PROGRAMACIONES_XLSX_BASE64 } from './plantilla-programaciones-empresa';

type CampoExcel =
  | 'rucEmpresa'
  | 'razonSocialEmpresa'
  | 'codProtocolo'
  | 'nombreProtocolo'
  | 'fechaProgramada'
  | 'sede'
  | 'apePatCliente'
  | 'apeMatCliente'
  | 'nombreCliente'
  | 'tipoDoc'
  | 'nroDoc'
  | 'sexoCliente'
  | 'fechaNacimiento'
  | 'tipoEvaluacion'
  | 'tipoAtencion'
  | 'prioridad'
  | 'observaciones';

interface ColumnaExcel {
  encabezado: string;
  campo: CampoExcel;
  obligatorio: boolean;
  ejemplo: string;
  indicacion: string;
  ancho: number;
}

interface FilaPreview {
  filaExcel: number;
  datos: Record<CampoExcel, string>;
  datosExcelOriginales: Record<CampoExcel, string>;
  empresaId: string;
  protocoloId: string;
  modificada: boolean;
  errores: string[];
  advertencias: string[];
  validacionServidor?: IResultadoValidacionImportacion;
  revisionConfirmada?: boolean;
  excluida?: boolean;
  motivoExclusion?: string;
}

const COLUMNAS: ColumnaExcel[] = [
  { encabezado: 'RUC empresa', campo: 'rucEmpresa', obligatorio: true, ejemplo: '20123456789', indicacion: '11 dígitos. Se cotejará en LAB FRAY.', ancho: 17 },
  { encabezado: 'Razón social empresa', campo: 'razonSocialEmpresa', obligatorio: false, ejemplo: 'EMPRESA DEMOSTRACIÓN SAC', indicacion: 'Opcional; se contrastará con el maestro.', ancho: 31 },
  { encabezado: 'Código protocolo', campo: 'codProtocolo', obligatorio: false, ejemplo: '20123456789-P013', indicacion: 'Opcional si se desconoce el código.', ancho: 25 },
  { encabezado: 'Nombre protocolo', campo: 'nombreProtocolo', obligatorio: false, ejemplo: 'ETAS 3', indicacion: 'Opcional. Se asignará el protocolo vigente al validar.', ancho: 31 },
  { encabezado: 'Fecha programación', campo: 'fechaProgramada', obligatorio: true, ejemplo: '20/10/2026', indicacion: 'Formato dd/MM/yyyy.', ancho: 22 },
  { encabezado: 'Sede', campo: 'sede', obligatorio: true, ejemplo: 'Callao', indicacion: 'Callao / Comas / NoIndica.', ancho: 17 },
  { encabezado: 'Apellido paterno', campo: 'apePatCliente', obligatorio: true, ejemplo: 'PÉREZ', indicacion: 'Apellido paterno del trabajador.', ancho: 22 },
  { encabezado: 'Apellido materno', campo: 'apeMatCliente', obligatorio: false, ejemplo: 'GÓMEZ', indicacion: 'Opcional.', ancho: 22 },
  { encabezado: 'Nombres', campo: 'nombreCliente', obligatorio: true, ejemplo: 'JUAN CARLOS', indicacion: 'Nombres del trabajador.', ancho: 28 },
  { encabezado: 'Tipo documento', campo: 'tipoDoc', obligatorio: false, ejemplo: 'DNI', indicacion: 'DNI / CE / PASAPORTE. Vacío si no se conoce.', ancho: 19 },
  { encabezado: 'Número documento', campo: 'nroDoc', obligatorio: false, ejemplo: '12345678', indicacion: 'Dejar ambos campos de documento vacíos si está pendiente.', ancho: 22 },
  { encabezado: 'Sexo', campo: 'sexoCliente', obligatorio: false, ejemplo: 'Masculino', indicacion: 'Masculino / Femenino. Opcional.', ancho: 17 },
  { encabezado: 'Fecha nacimiento', campo: 'fechaNacimiento', obligatorio: false, ejemplo: '01/01/1990', indicacion: 'Formato dd/MM/yyyy. Opcional.', ancho: 22 },
  { encabezado: 'Tipo evaluación', campo: 'tipoEvaluacion', obligatorio: true, ejemplo: 'ETAs', indicacion: 'ETAs / Ocupacional / PreOcupacional / Retiro / Toxicológico / Otro.', ancho: 24 },
  { encabezado: 'Tipo atención', campo: 'tipoAtencion', obligatorio: false, ejemplo: 'Regular', indicacion: 'Regular / Preferencial / VIP. Vacío equivale a Regular.', ancho: 21 },
  { encabezado: 'Prioridad', campo: 'prioridad', obligatorio: false, ejemplo: 'Normal', indicacion: 'Normal / Alta. Vacío equivale a Normal.', ancho: 17 },
  { encabezado: 'Observaciones', campo: 'observaciones', obligatorio: false, ejemplo: 'Presentarse en ayunas', indicacion: 'Opcional; máximo 200 caracteres.', ancho: 36 },
];

// ====== Calendarios en formato peruano ======
const FORMATOS_FECHA_IMPORTACION: MatDateFormats = {
  parse: { dateInput: null },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { day: 'numeric', month: 'long', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};

// ====== Conservar lectura de plantillas descargadas en PE.4.1 ======
const COLUMNAS_ANTERIORES = COLUMNAS.filter((c) =>
  c.campo !== 'razonSocialEmpresa' && c.campo !== 'nombreProtocolo'
);

@Component({
  selector: 'app-dialog-importar-programaciones-empresa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatIconModule, MatDatepickerModule, MatInputModule, MatNativeDateModule],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: FORMATOS_FECHA_IMPORTACION },
  ],
  templateUrl: './dialog-importar-programaciones-empresa.component.html',
  styleUrl: './dialog-importar-programaciones-empresa.component.scss',
})
export class DialogImportarProgramacionesEmpresaComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DialogImportarProgramacionesEmpresaComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly programacionService = inject(ProgramacionEmpresaService);

  readonly maxFilas = 1000;
  readonly tamanoPagina = 25;
  readonly sedes = ['Callao', 'Comas', 'NoIndica'];
  readonly evaluaciones = ['ETAs', 'Ocupacional', 'PreOcupacional', 'Retiro', 'Toxicológico', 'Otro'];
  readonly tiposAtencion = ['Regular', 'Preferencial', 'VIP'];
  readonly prioridades = ['Normal', 'Alta'];
  readonly tiposDocumento = ['DNI', 'CE', 'PASAPORTE'];
  readonly sexos = ['Masculino', 'Femenino'];

  nombreArchivo = '';
  mensajeError = '';
  mensajeCatalogo = '';
  mensajeLote = '';
  cargando = false;
  cargandoEmpresas = false;
  soloObservadas = false;
  textoFiltro = '';
  paginaActual = 0;
  filas: FilaPreview[] = [];
  empresas: IEmpresa[] = [];
  seleccionadas = new Set<number>();
  filaEnEdicion: FilaPreview | null = null;
  filtroEmpresaEdicion = '';
  filtroEmpresaLote = '';
  validando = false;
  mensajeValidacion = '';
  ultimaValidacion: IValidacionMasivaProgramacionesResponse | null = null;
  private revisionDatos = 0;
  registrando = false;
  importacionIniciada = false;
  importacionCompleta = false;
  progresoLotes = 0;
  totalLotes = 0;
  mensajeRegistro = '';
  private importacionId = '';
  resultadosRegistro: IResultadoRegistroImportacion[] = [];


  // ====== Controles de fecha aislados de los datos dd/MM/yyyy ======
  readonly fechaEdicionControl = new FormControl<Date | null>(null);
  readonly fechaNacimientoControl = new FormControl<Date | null>(null);
  readonly fechaLoteControl = new FormControl<Date | null>(null);

  readonly formularioEdicion = this.fb.nonNullable.group({
    empresaId: '', protocoloId: '', rucEmpresa: '', razonSocialEmpresa: '',
    codProtocolo: '', nombreProtocolo: '', fechaProgramada: '', sede: '',
    apePatCliente: '', apeMatCliente: '', nombreCliente: '', tipoDoc: '', nroDoc: '',
    sexoCliente: '', fechaNacimiento: '', tipoEvaluacion: '', tipoAtencion: '',
    prioridad: '', observaciones: '',
  });
  readonly formularioLote = this.fb.nonNullable.group({
    empresaId: '', protocoloId: '', fechaProgramada: '', sede: '',
    tipoEvaluacion: '', tipoAtencion: '', prioridad: '',
  });

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  private cargarEmpresas(): void {
    this.cargandoEmpresas = true;
    this.mensajeCatalogo = '';
    this.empresaService.getLastEmpresas(1000).subscribe({
      next: (empresas) => {
        this.incorporarEmpresas(empresas);
        this.cargandoEmpresas = false;
      },
      error: () => {
        this.cargandoEmpresas = false;
        this.mensajeCatalogo = 'No se pudo consultar el catálogo de empresas. Reintenta o búscalas por nombre/RUC.';
      },
    });
  }

  recargarEmpresas(): void {
    this.cargarEmpresas();
  }

  private incorporarEmpresas(empresas: IEmpresa[]): void {
    const mapa = new Map(this.empresas.map((e) => [String(e._id), e]));
    empresas.filter((e) => e._id && e.estado !== false).forEach((e) => mapa.set(String(e._id), e));
    this.empresas = [...mapa.values()].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, 'es'));
  }

  buscarEnCatalogo(ambito: 'edicion' | 'lote'): void {
    const termino = (ambito === 'edicion' ? this.filtroEmpresaEdicion : this.filtroEmpresaLote).trim();
    if (termino.length < 2) {
      this.mensajeCatalogo = 'Escribe al menos dos caracteres del RUC o razón social.';
      return;
    }
    this.cargandoEmpresas = true;
    this.empresaService.getEmpresa(termino).subscribe({
      next: (empresas) => {
        this.incorporarEmpresas(empresas);
        this.cargandoEmpresas = false;
        this.mensajeCatalogo = empresas.length ? '' : 'No se encontraron empresas con ese criterio.';
      },
      error: () => {
        this.cargandoEmpresas = false;
        this.mensajeCatalogo = 'No se pudo buscar la empresa. Intenta nuevamente.';
      },
    });
  }

  private filtrarEmpresas(termino: string, seleccionada: string): IEmpresa[] {
    const buscar = this.normalizar(termino);
    const filtradas = buscar
      ? this.empresas.filter((e) => this.normalizar(`${e.ruc} ${e.razonSocial}`).includes(buscar))
      : this.empresas;
    const principales = filtradas.slice(0, 80);
    const actual = this.empresas.find((e) => e._id === seleccionada);
    if (actual && !principales.some((e) => e._id === actual._id)) principales.unshift(actual);
    return principales;
  }

  get empresasEdicion(): IEmpresa[] {
    return this.filtrarEmpresas(this.filtroEmpresaEdicion, this.formularioEdicion.controls.empresaId.value);
  }

  get empresasLote(): IEmpresa[] {
    return this.filtrarEmpresas(this.filtroEmpresaLote, this.formularioLote.controls.empresaId.value);
  }

  private buscarEmpresa(id: string): IEmpresa | undefined {
    return this.empresas.find((e) => e._id === id);
  }

  private protocolosDeEmpresa(id: string): IProtocoloEmpresa[] {
    return (this.buscarEmpresa(id)?.protocolos ?? [])
      .filter((p) => p.estado !== false && p._id)
      .sort((a, b) => a.nombreProtocolo.localeCompare(b.nombreProtocolo, 'es'));
  }

  get protocolosEdicion(): IProtocoloEmpresa[] {
    return this.protocolosDeEmpresa(this.formularioEdicion.controls.empresaId.value);
  }

  get protocolosLote(): IProtocoloEmpresa[] {
    return this.protocolosDeEmpresa(this.formularioLote.controls.empresaId.value);
  }

  cambioEmpresaEdicion(): void {
    const empresa = this.buscarEmpresa(this.formularioEdicion.controls.empresaId.value);
    this.formularioEdicion.patchValue({
      protocoloId: '', codProtocolo: '', nombreProtocolo: '',
      rucEmpresa: empresa?.ruc ?? '', razonSocialEmpresa: empresa?.razonSocial ?? '',
    });
  }

  cambioProtocoloEdicion(): void {
    const protocolo = this.protocolosEdicion.find((p) => p._id === this.formularioEdicion.controls.protocoloId.value);
    this.formularioEdicion.patchValue({
      codProtocolo: protocolo?.codigoProtocolo ?? '',
      nombreProtocolo: protocolo?.nombreProtocolo ?? '',
    });
  }

  cambioEmpresaLote(): void {
    this.formularioLote.patchValue({ protocoloId: '' });
  }

  // ====== Resultados de revisión contra MongoDB ======
  // ====== Filas incluidas y excluidas de la importación ======
  get filasIncluidas(): FilaPreview[] { return this.filas.filter((f) => !f.excluida); }
  get totalExcluidas(): number { return this.filas.length - this.filasIncluidas.length; }

  async cambiarExclusion(fila: FilaPreview): Promise<void> {
    if (this.registrando || this.importacionIniciada || this.validando) return;
    if (fila.excluida) {
      fila.excluida = false;
      fila.motivoExclusion = '';
    } else {
      const confirmacion = await Swal.fire({
        title: `Excluir fila ${fila.filaExcel}`,
        text: 'Esta fila no se validará ni registrará. Puedes volver a incluirla antes de iniciar la importación.',
        icon: 'question', input: 'textarea', inputLabel: 'Motivo de exclusión (opcional)',
        inputPlaceholder: 'Por ejemplo: datos pendientes de confirmar con la empresa',
        inputAttributes: { maxlength: '300' },
        showCancelButton: true, confirmButtonText: 'Excluir fila', cancelButtonText: 'Mantener fila',
        confirmButtonColor: '#a65c16',
      });
      if (!confirmacion.isConfirmed || this.importacionIniciada || this.registrando || this.validando) return;
      fila.excluida = true;
      fila.motivoExclusion = String(confirmacion.value ?? '').trim() || 'Excluida por el operador';
      this.seleccionadas.delete(fila.filaExcel);
      if (this.filaEnEdicion === fila) this.filaEnEdicion = null;
    }
    // ====== Al cambiar exclusiones, recalcular duplicados y validar nuevamente ======
    this.revalidarFilas();
    this.mensajeLote = '';
  }

  get correctasServidor(): number { return this.ultimaValidacion?.resumen.correctos ?? 0; }
  get revisarServidor(): number { return this.ultimaValidacion?.resumen.revisar ?? 0; }
  get bloqueadasServidor(): number { return this.ultimaValidacion?.resumen.bloqueados ?? 0; }

  // ====== No editar después del primer lote registrado ======
  get pendientesPorConfirmar(): number {
    return this.filasIncluidas.filter((f) => f.validacionServidor?.estado === 'REVISAR' && !f.revisionConfirmada).length;
  }

  get listaAptaParaRegistro(): boolean {
    return !!this.ultimaValidacion && this.filasIncluidas.length > 0 &&
      !this.validando && !this.registrando && !this.filaEnEdicion &&
      this.filasIncluidas.every((f) => !!f.validacionServidor && f.validacionServidor.estado !== 'BLOQUEADO' &&
        f.validacionServidor.paciente.estado !== 'COINCIDENCIA_NOMBRE' &&
        (f.validacionServidor.estado !== 'REVISAR' || f.revisionConfirmada === true));
  }

  cambiarConfirmacionRevision(fila: FilaPreview, confirmada: boolean): void {
    if (this.registrando || this.importacionIniciada || fila.validacionServidor?.estado !== 'REVISAR' ||
        fila.validacionServidor?.paciente.estado === 'COINCIDENCIA_NOMBRE') return;
    fila.revisionConfirmada = confirmada;
  }

  private construirFilasRegistro(): IFilaRegistroImportacion[] {
    return this.filasIncluidas.map((f) => ({
      filaExcel: f.filaExcel, empresaId: f.empresaId, protocoloId: f.protocoloId,
      datos: {
        ...f.datos,
        fechaProgramada: this.fechaAPI(f.datos.fechaProgramada),
        fechaNacimiento: f.datos.fechaNacimiento ? this.fechaAPI(f.datos.fechaNacimiento) : '',
      },
      confirmada: f.revisionConfirmada === true,
      advertenciasOriginales: f.advertencias.filter((a) =>
        !a.startsWith('Empresa sin seleccionar') && !a.startsWith('Protocolo sin seleccionar')),
    }));
  }

  async registrarImportacion(): Promise<void> {
    if (this.registrando || this.importacionCompleta || !this.listaAptaParaRegistro) {
      this.mensajeRegistro = 'Corrige las filas bloqueadas, resuelve las posibles HC y confirma las observaciones antes de registrar.';
      return;
    }
    const confirmacion = await Swal.fire({
      title: 'Confirmar registro masivo',
      text: `Se registrarán ${this.filasIncluidas.length} programaciones en lotes de hasta 100. ${this.totalExcluidas ? `${this.totalExcluidas} fila(s) excluidas NO se registrarán. ` : ''}Las HC existentes coincidentes serán vinculadas; no se crearán pacientes ni historias clínicas en esta etapa. ¿Continuar?`,
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Registrar programaciones', cancelButtonText: 'Volver a revisar',
      confirmButtonColor: '#075bbb',
    });
    if (!confirmacion.isConfirmed) return;
    if (!this.importacionId) {
      this.importacionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `imp-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    }
    const filas = this.construirFilasRegistro();
    const lotes: IFilaRegistroImportacion[][] = [];
    for (let i = 0; i < filas.length; i += 100) lotes.push(filas.slice(i, i + 100));
    this.importacionIniciada = true;
    this.registrando = true;
    this.totalLotes = lotes.length;
    this.progresoLotes = 0;
    this.mensajeRegistro = '';
    this.resultadosRegistro = [];
    from(lotes).pipe(
      concatMap((lote) => this.programacionService.registrarImportacionMasiva(this.importacionId, lote)),
      tap((res) => {
        this.progresoLotes++;
        this.resultadosRegistro.push(...res.resultados);
      }),
      toArray(),
    ).subscribe({
      next: () => {
        this.registrando = false;
        this.importacionCompleta = true;
        this.mensajeRegistro = `Importación completada: ${this.resultadosRegistro.filter((r) => r.estado === 'REGISTRADA').length} nuevas programaciones${this.totalExcluidas ? ` y ${this.totalExcluidas} excluidas` : ''}.`;
      },
      error: (error) => {
        this.registrando = false;
        const detalle = error?.error?.detalles?.[0];
        this.mensajeRegistro = `${error?.error?.msg || 'El registro se interrumpió.'}` +
          (detalle ? ` Fila ${detalle.filaExcel}: ${detalle.errores?.join(' ') || 'Revisar datos.'}` : '') +
          ' Los lotes ya confirmados permanecen guardados; puedes reintentar con el mismo identificador.';
      },
    });
  }

  descargarReporte(): void {
    if (!this.resultadosRegistro.length) return;
    const porFila = new Map(this.resultadosRegistro.map((r) => [r.filaExcel, r]));
    const datos = this.filas.map((f) => {
      const resultado = porFila.get(f.filaExcel);
      return {
        'Fila Excel': f.filaExcel,
        'Trabajador': [f.datos.apePatCliente, f.datos.apeMatCliente, f.datos.nombreCliente].filter(Boolean).join(' '),
        'Documento': f.datos.nroDoc ? `${f.datos.tipoDoc} ${f.datos.nroDoc}` : 'Pendiente',
        'RUC empresa': f.datos.rucEmpresa,
        'Protocolo': f.datos.nombreProtocolo,
        'Resultado': f.excluida ? 'EXCLUIDA' : (resultado?.estado ?? 'NO REGISTRADA'),
        'Motivo exclusión': f.excluida ? (f.motivoExclusion || 'Excluida por el operador') : '',
        'Código programación': resultado?.codProgramacion ?? '',
        'HC existente': resultado?.hc ?? '',
      };
    });
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Resultado importación');
    XLSX.writeFile(libro, `Reporte_Programaciones_${this.importacionId}.xlsx`);
  }

  private invalidarValidacion(): void {
    this.revisionDatos++;
    this.ultimaValidacion = null;
    this.mensajeValidacion = '';
    this.validando = false;
    this.filas.forEach((fila) => { fila.validacionServidor = undefined; fila.revisionConfirmada = false; });
  }

  private fechaAPI(fecha: string): string {
    if (!this.fechaCorrecta(fecha)) return '';
    const [dia, mes, anio] = fecha.split('/');
    return `${anio}-${mes}-${dia}`;
  }

  validarContraMongoDB(): void {
    if (this.importacionIniciada || this.registrando) return;
    if (this.validando || !this.filas.length) return;
    if (!this.filasIncluidas.length) {
      this.mensajeValidacion = 'Incluye al menos una fila para validar con el sistema.';
      return;
    }
    if (this.filaEnEdicion) {
      this.mensajeValidacion = 'Guarda o cancela la edición abierta antes de validar.';
      return;
    }
    this.mensajeLote = '';
    const revision = ++this.revisionDatos;
    this.validando = true;
    this.mensajeValidacion = '';
    this.ultimaValidacion = null;
    this.filas.forEach((fila) => { fila.validacionServidor = undefined; fila.revisionConfirmada = false; });
    const filas: IFilaValidacionImportacion[] = this.filasIncluidas.map((fila) => ({
      filaExcel: fila.filaExcel, empresaId: fila.empresaId,
      protocoloId: fila.protocoloId,
      datos: {
        rucEmpresa: fila.datos.rucEmpresa,
        razonSocialEmpresa: fila.datos.razonSocialEmpresa,
        codProtocolo: fila.datos.codProtocolo,
        nombreProtocolo: fila.datos.nombreProtocolo,
        fechaProgramada: this.fechaAPI(fila.datos.fechaProgramada),
        sede: fila.datos.sede,
        tipoEvaluacion: fila.datos.tipoEvaluacion,
        tipoAtencion: fila.datos.tipoAtencion,
        prioridad: fila.datos.prioridad,
        apePatCliente: fila.datos.apePatCliente,
        apeMatCliente: fila.datos.apeMatCliente,
        nombreCliente: fila.datos.nombreCliente,
        tipoDoc: fila.datos.tipoDoc,
        nroDoc: fila.datos.nroDoc,
        sexoCliente: fila.datos.sexoCliente,
        fechaNacimiento: fila.datos.fechaNacimiento ? this.fechaAPI(fila.datos.fechaNacimiento) : '',
        observaciones: fila.datos.observaciones,
      },
    }));
    // ====== Lotes pequeños para respetar el tamaño máximo de petición ======
    const lotes: IFilaValidacionImportacion[][] = [];
    for (let i = 0; i < filas.length; i += 100) lotes.push(filas.slice(i, i + 100));
    from(lotes).pipe(
      concatMap((lote) => this.programacionService.validarImportacionMasiva(lote)),
      toArray(),
    ).subscribe({
      next: (respuestas) => {
        if (revision !== this.revisionDatos) return;
        this.validando = false;
        const respuesta = respuestas[0];
        const resultados = new Map(respuestas.flatMap((r) => r.resultados).map((r) => [r.filaExcel, r]));
        if (resultados.size !== this.filasIncluidas.length) {
          this.mensajeValidacion = 'La validación devolvió una cantidad de filas diferente. Intenta nuevamente.';
          return;
        }
        const estados = { correctos: 0, revisar: 0, bloqueados: 0 };
        const nuevosResultados = this.filasIncluidas.map((fila) => {
          const servidor = resultados.get(fila.filaExcel)!;
          const errores = [...new Set([...fila.errores, ...servidor.errores])];
          const advertencias = [...new Set([...fila.advertencias, ...servidor.advertencias])];
          const estado = errores.length ? 'BLOQUEADO' : advertencias.length ? 'REVISAR' : 'CORRECTO';
          if (estado === 'BLOQUEADO') estados.bloqueados++;
          else if (estado === 'REVISAR') estados.revisar++;
          else estados.correctos++;
          const resultado: IResultadoValidacionImportacion = { ...servidor, estado, errores, advertencias };
          fila.validacionServidor = resultado;
          return resultado;
        });
        this.ultimaValidacion = { ...respuesta, resultados: nuevosResultados, resumen: { ...estados, total: nuevosResultados.length } };
        this.mensajeValidacion = 'Verificación realizada. Revisa las HC encontradas y las observaciones antes de continuar.';
      },
      error: (error) => {
        if (revision !== this.revisionDatos) return;
        this.validando = false;
        this.mensajeValidacion = error?.error?.msg || 'No se pudo validar contra MongoDB. Verifica la conexión con el backend.';
      },
    });
  }

  get totalValidas(): number {
    return this.filas.filter((fila) => fila.errores.length === 0).length;
  }

  get totalConErrores(): number {
    return this.filas.length - this.totalValidas;
  }

  get sinDocumento(): number {
    return this.filas.filter((fila) => !fila.datos.nroDoc).length;
  }

  get sinConciliar(): number {
    return this.filas.filter((fila) => !fila.empresaId || !fila.protocoloId).length;
  }

  get filasFiltradas(): FilaPreview[] {
    const filtro = this.normalizar(this.textoFiltro);
    return this.filas.filter((fila) => {
      if (this.soloObservadas && !fila.excluida && !fila.errores.length && !fila.advertencias.length && (!fila.validacionServidor || fila.validacionServidor.estado === 'CORRECTO')) return false;
      if (!filtro) return true;
      const datos = fila.datos;
      return this.normalizar([
        fila.filaExcel, datos.nombreCliente, datos.apePatCliente, datos.apeMatCliente,
        datos.nroDoc, datos.rucEmpresa, datos.razonSocialEmpresa, datos.codProtocolo,
        datos.nombreProtocolo, fila.validacionServidor?.paciente.hc,
      ].join(' ')).includes(filtro);
    });
  }

  get filasVisibles(): FilaPreview[] {
    const offset = this.paginaActual * this.tamanoPagina;
    return this.filasFiltradas.slice(offset, offset + this.tamanoPagina);
  }

  get totalFiltradas(): number {
    return this.filasFiltradas.length;
  }

  get paginasTotales(): number {
    return Math.max(1, Math.ceil(this.totalFiltradas / this.tamanoPagina));
  }

  cambiarPagina(direccion: -1 | 1): void {
    this.paginaActual = Math.max(0, Math.min(this.paginasTotales - 1, this.paginaActual + direccion));
    this.filaEnEdicion = null;
  }

  filtrar(): void {
    this.paginaActual = 0;
    this.filaEnEdicion = null;
  }

  get paginaSeleccionada(): boolean {
    const disponibles = this.filasVisibles.filter((fila) => !fila.excluida);
    return disponibles.length > 0 && disponibles.every((fila) => this.seleccionadas.has(fila.filaExcel));
  }

  cambiarSeleccion(filaExcel: number, marcada: boolean): void {
    if (marcada && this.filas.some((fila) => fila.filaExcel === filaExcel && !fila.excluida)) this.seleccionadas.add(filaExcel);
    else this.seleccionadas.delete(filaExcel);
  }

  seleccionarPagina(marcada: boolean): void {
    this.filasVisibles.forEach((fila) => this.cambiarSeleccion(fila.filaExcel, marcada));
  }

  seleccionarTodas(): void {
    this.filasIncluidas.forEach((fila) => this.seleccionadas.add(fila.filaExcel));
  }

  limpiarSeleccion(): void {
    this.seleccionadas.clear();
    this.mensajeLote = '';
  }

  // ====== Convertir fechas entre los calendarios y el Excel ======
  private fechaParaCalendario(valor: string): Date | null {
    if (!this.fechaCorrecta(valor)) return null;
    const [dia, mes, anio] = valor.split('/').map(Number);
    return new Date(anio, mes - 1, dia, 12);
  }

  private fechaDeCalendario(valor: Date | null): string {
    if (!valor || Number.isNaN(valor.getTime())) return '';
    return `${String(valor.getDate()).padStart(2, '0')}/${String(valor.getMonth() + 1).padStart(2, '0')}/${valor.getFullYear()}`;
  }

  abrirEdicion(fila: FilaPreview): void {
    if (this.importacionIniciada || this.registrando || fila.excluida) return;
    if (this.filaEnEdicion?.filaExcel === fila.filaExcel) {
      this.filaEnEdicion = null;
      return;
    }
    this.filtroEmpresaEdicion = '';
    this.filaEnEdicion = fila;
    this.formularioEdicion.reset({ ...fila.datos, empresaId: fila.empresaId, protocoloId: fila.protocoloId });
    this.fechaEdicionControl.setValue(this.fechaParaCalendario(fila.datos.fechaProgramada));
    this.fechaNacimientoControl.setValue(this.fechaParaCalendario(fila.datos.fechaNacimiento));
  }

  cancelarEdicion(): void {
    this.filaEnEdicion = null;
  }

  // ====== Cotejar Excel con historia clínica encontrada por documento ======
  fechaMaestraVisible(fecha: string | Date | null | undefined): string {
    if (!fecha) return 'Sin dato';
    // ====== Admitir fecha del maestro como Date o texto ISO ======
    const valor = fecha instanceof Date
      ? (Number.isNaN(fecha.getTime()) ? '' : fecha.toISOString().slice(0, 10))
      : fecha.trim();
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(valor);
    if (!coincidencia) return 'Sin dato';
    const [, anio, mes, dia] = coincidencia;
    return `${dia}/${mes}/${anio}`;
  }

  campoCoincide(valorExcel: string | null | undefined, valorMaestro: string | null | undefined): boolean {
    return this.normalizar(valorExcel) === this.normalizar(valorMaestro);
  }

  puedeUsarDatosHC(fila: FilaPreview): boolean {
    const verificacion = fila.validacionServidor?.paciente;
    const maestro = verificacion?.datosMaestros;
    const form = this.formularioEdicion.controls;
    return !this.importacionIniciada && !this.registrando &&
      !!this.ultimaValidacion && this.filaEnEdicion === fila &&
      !!verificacion?.hc && !!maestro && !!verificacion?.pacienteId &&
      ['HC_COINCIDE', 'IDENTIDAD_DIFERENTE'].includes(verificacion.estado) &&
      this.normalizar(form.tipoDoc.value) === this.normalizar(maestro.tipoDoc) &&
      this.normalizar(form.nroDoc.value) === this.normalizar(maestro.nroDoc) &&
      this.normalizar(fila.datos.tipoDoc) === this.normalizar(maestro.tipoDoc) &&
      this.normalizar(fila.datos.nroDoc) === this.normalizar(maestro.nroDoc);
  }

  async usarDatosHistoriaClinica(fila: FilaPreview): Promise<void> {
    if (!this.puedeUsarDatosHC(fila)) return;
    const maestro = fila.validacionServidor?.paciente?.datosMaestros;
    if (!maestro) return;
    const revision = this.revisionDatos;
    const confirmacion = await Swal.fire({
      title: 'Utilizar datos de la historia clínica',
      text: 'Comprueba primero que el documento corresponde realmente a este trabajador. Se copiarán nombres y apellidos, y sexo y nacimiento si constan en la HC. El Excel original se conservará para comparación.',
      icon: 'warning', input: 'checkbox', inputValue: 0,
      inputPlaceholder: 'Confirmo que he verificado la identidad y el documento del trabajador.',
      inputValidator: (valor) => valor ? null : 'Debes confirmar la comprobación de identidad.',
      showCancelButton: true, confirmButtonText: 'Usar datos de HC', cancelButtonText: 'Cancelar',
    });
    if (!confirmacion.isConfirmed || revision !== this.revisionDatos || !this.puedeUsarDatosHC(fila)) return;
    this.formularioEdicion.patchValue({
      apePatCliente: maestro.apePatCliente,
      apeMatCliente: maestro.apeMatCliente,
      nombreCliente: maestro.nombreCliente,
      ...(maestro.sexoCliente ? { sexoCliente: maestro.sexoCliente } : {}),
    });
    if (maestro.fechaNacimiento) {
      this.fechaNacimientoControl.setValue(this.fechaParaCalendario(this.fechaMaestraVisible(maestro.fechaNacimiento)));
    }
    // ====== Mantener edición abierta para guardar y volver a validar ======
    this.mensajeValidacion = 'Se copiaron los datos de la HC en el editor. Guarda la fila y valida nuevamente con el sistema.';
  }

  guardarEdicion(): void {
    if (this.importacionIniciada || this.registrando) return;
    if (!this.filaEnEdicion) return;
    const valores = this.formularioEdicion.getRawValue();
    valores.fechaProgramada = this.fechaDeCalendario(this.fechaEdicionControl.value);
    valores.fechaNacimiento = this.fechaDeCalendario(this.fechaNacimientoControl.value);
    const empresa = this.buscarEmpresa(valores.empresaId);
    const protocolo = this.protocolosEdicion.find((p) => p._id === valores.protocoloId);
    const datos = { ...this.filaEnEdicion.datos };
    COLUMNAS.forEach(({ campo }) => { datos[campo] = valores[campo].trim(); });
    if (empresa) {
      datos.rucEmpresa = empresa.ruc;
      datos.razonSocialEmpresa = empresa.razonSocial;
    }
    if (protocolo) {
      datos.codProtocolo = protocolo.codigoProtocolo;
      datos.nombreProtocolo = protocolo.nombreProtocolo;
    }
    datos.tipoAtencion ||= 'Regular';
    datos.prioridad ||= 'Normal';
    this.filaEnEdicion.datos = datos;
    this.filaEnEdicion.empresaId = empresa?._id ?? '';
    this.filaEnEdicion.protocoloId = protocolo?._id ?? '';
    this.filaEnEdicion.modificada = true;
    this.filaEnEdicion = null;
    this.revalidarFilas();
  }

  aplicarLote(): void {
    if (this.importacionIniciada || this.registrando) return;
    this.mensajeLote = '';
    if (this.seleccionadas.size === 0) {
      this.mensajeLote = 'Selecciona al menos una fila.';
      return;
    }
    const valores = this.formularioLote.getRawValue();
    valores.fechaProgramada = this.fechaDeCalendario(this.fechaLoteControl.value);
    const empresa = this.buscarEmpresa(valores.empresaId);
    const protocolo = this.protocolosLote.find((p) => p._id === valores.protocoloId);
    const campos = ['fechaProgramada', 'sede', 'tipoEvaluacion', 'tipoAtencion', 'prioridad'] as const;
    if (!empresa && !protocolo && !campos.some((campo) => valores[campo].trim())) {
      this.mensajeLote = 'Selecciona al menos un valor para aplicar.';
      return;
    }
    if (valores.fechaProgramada && !this.fechaCorrecta(valores.fechaProgramada.trim())) {
      this.mensajeLote = 'La fecha para aplicar debe estar en formato dd/MM/yyyy y ser válida.';
      return;
    }
    if (valores.empresaId && !empresa) {
      this.mensajeLote = 'Selecciona una empresa real del catálogo.';
      return;
    }
    if (valores.protocoloId && !protocolo) {
      this.mensajeLote = 'Selecciona un protocolo activo de la empresa.';
      return;
    }
    let afectadas = 0;
    for (const fila of this.filas) {
      if (fila.excluida || !this.seleccionadas.has(fila.filaExcel)) continue;
      if (empresa) {
        const anterior = fila.empresaId;
        fila.empresaId = empresa._id ?? '';
        fila.datos.rucEmpresa = empresa.ruc;
        fila.datos.razonSocialEmpresa = empresa.razonSocial;
        if (anterior !== fila.empresaId) {
          fila.protocoloId = '';
          fila.datos.codProtocolo = '';
          fila.datos.nombreProtocolo = '';
        }
      }
      if (protocolo) {
        fila.protocoloId = protocolo._id ?? '';
        fila.datos.codProtocolo = protocolo.codigoProtocolo;
        fila.datos.nombreProtocolo = protocolo.nombreProtocolo;
      }
      campos.forEach((campo) => {
        if (valores[campo].trim()) fila.datos[campo] = valores[campo].trim();
      });
      fila.modificada = true;
      afectadas++;
    }
    this.formularioLote.reset();
    this.fechaLoteControl.reset();
    this.filaEnEdicion = null;
    this.revalidarFilas();
    this.limpiarSeleccion();
    this.mensajeLote = `Se actualizaron ${afectadas} filas. Revisa las observaciones antes de continuar.`;
  }

  private revalidarFilas(): void {
    this.invalidarValidacion();
    const claves = new Map<string, number>();
    for (const fila of this.filas) {
      fila.errores = this.validar(fila.datos);
      fila.advertencias = [];
      if (!fila.datos.nroDoc) fila.advertencias.push('Documento pendiente: revisar identidad.');
      if (!fila.empresaId) fila.advertencias.push('Empresa sin seleccionar del catálogo.');
      if (!fila.protocoloId) fila.advertencias.push('Protocolo sin seleccionar del catálogo.');
      if (fila.empresaId && fila.datosExcelOriginales.rucEmpresa &&
          this.normalizar(fila.datosExcelOriginales.rucEmpresa) !== this.normalizar(fila.datos.rucEmpresa)) {
        fila.advertencias.push('El RUC seleccionado difiere del Excel original; revisar.');
      }
      if (fila.protocoloId && fila.datosExcelOriginales.codProtocolo &&
          this.normalizar(fila.datosExcelOriginales.codProtocolo) !== this.normalizar(fila.datos.codProtocolo)) {
        fila.advertencias.push('El código de protocolo seleccionado difiere del Excel original; revisar.');
      }
      if (fila.excluida || fila.errores.length) continue;
      const d = fila.datos;
      const identificacion = d.nroDoc
        ? `${this.normalizar(d.tipoDoc)}:${this.normalizar(d.nroDoc)}`
        : [d.apePatCliente, d.apeMatCliente, d.nombreCliente].map((v) => this.normalizar(v)).join(':');
      const clave = [fila.empresaId || d.rucEmpresa, fila.protocoloId || d.codProtocolo || d.nombreProtocolo || 'PENDIENTE', d.fechaProgramada, identificacion]
        .map((v) => this.normalizar(v)).join('|');
      const original = claves.get(clave);
      if (original) fila.errores.push(`Posible duplicado de fila ${original} dentro del Excel.`);
      else claves.set(clave, fila.filaExcel);
    }
    this.paginaActual = Math.min(this.paginaActual, this.paginasTotales - 1);
  }

  descargarPlantilla(): void {
    // ====== Plantilla XLSX con desplegables reales y datos de ejemplo solo en Instrucciones ======
    const contenido = atob(PLANTILLA_PROGRAMACIONES_XLSX_BASE64);
    const buffer = new ArrayBuffer(contenido.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < contenido.length; i++) bytes[i] = contenido.charCodeAt(i);
    const archivo = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'Plantilla_Programaciones_Empresa_LABFRAY.xlsx';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async seleccionarArchivo(evento: Event): Promise<void> {
    if (this.importacionIniciada || this.registrando) return;
    this.importacionId = '';
    this.resultadosRegistro = [];
    this.importacionCompleta = false;
    this.mensajeRegistro = '';
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    this.invalidarValidacion();
    this.filas = [];
    this.seleccionadas.clear();
    this.filaEnEdicion = null;
    this.paginaActual = 0;
    this.textoFiltro = '';
    this.mensajeLote = '';
    this.nombreArchivo = archivo.name;
    this.mensajeError = '';
    this.soloObservadas = false;

    if (!archivo.name.toLowerCase().endsWith('.xlsx')) {
      this.mensajeError = 'Selecciona un archivo .xlsx generado a partir de la plantilla.';
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.mensajeError = 'El archivo no puede superar 5 MB.';
      return;
    }

    this.cargando = true;
    try {
      const contenido = await archivo.arrayBuffer();
      const libro = XLSX.read(contenido, { type: 'array', cellDates: true });
      const hoja = libro.Sheets['Programaciones'];
      if (!hoja) {
        throw new Error('El Excel debe contener una hoja llamada Programaciones.');
      }

      const celdas = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
        header: 1,
        raw: true,
        defval: '',
        blankrows: true,
      });
      if (!celdas.length) throw new Error('La hoja Programaciones está vacía.');

      const cabeceras = celdas[0].map((v) => this.normalizar(v));
      // ====== Aceptar también la plantilla anterior sin columnas descriptivas ======
      const columnasArchivo = [COLUMNAS, COLUMNAS_ANTERIORES].find((opcion) =>
        cabeceras.length === opcion.length &&
        opcion.every((c, i) => cabeceras[i] === this.normalizar(c.encabezado))
      );
      if (!columnasArchivo) {
        throw new Error('Los encabezados no coinciden con la plantilla. Descárgala de nuevo y conserva el orden de las columnas.');
      }

      const filasExcel = celdas.slice(1)
        .map((celdasFila, indice) => ({ celdasFila, indice }))
        .filter(({ celdasFila }) => celdasFila.some((valor) => String(valor ?? '').trim() !== ''));

      if (filasExcel.length === 0) throw new Error('El archivo no contiene trabajadores para previsualizar.');
      if (filasExcel.length > this.maxFilas) throw new Error(`Máximo ${this.maxFilas} trabajadores por archivo.`);

      this.filas = filasExcel.map(({ celdasFila, indice }) => {
        const datos = {} as Record<CampoExcel, string>;
        COLUMNAS.forEach((columna) => { datos[columna.campo] = ''; });
        columnasArchivo.forEach((columna, i) => {
          const valor = celdasFila[i];
          datos[columna.campo] = columna.campo === 'fechaProgramada' || columna.campo === 'fechaNacimiento'
            ? this.textoFecha(valor)
            : this.textoCelda(valor);
        });
        datos.tipoAtencion ||= 'Regular';
        datos.prioridad ||= 'Normal';
        return {
          filaExcel: indice + 2, datos, datosExcelOriginales: { ...datos },
          empresaId: '', protocoloId: '', modificada: false, excluida: false, motivoExclusion: '',
          errores: [], advertencias: [],
        };
      });
      this.revalidarFilas();
    } catch (error) {
      this.filas = [];
      this.mensajeError = error instanceof Error ? error.message : 'No se pudo interpretar el archivo Excel.';
    } finally {
      this.cargando = false;
    }
  }

  async cerrar(): Promise<void> {
    if (this.registrando) return;
    if (this.importacionIniciada && !this.importacionCompleta) {
      const confirmacion = await Swal.fire({
        title: 'Importación incompleta',
        text: 'Algunos lotes pueden haberse registrado. Descarga el reporte antes de cerrar. Al cerrar perderás la posibilidad de reintentar con este mismo identificador desde esta pantalla.',
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Cerrar de todos modos', cancelButtonText: 'Seguir revisando',
      });
      if (!confirmacion.isConfirmed) return;
    }
    this.dialogRef.close({ importadas: this.resultadosRegistro.length > 0 });
  }

  private normalizar(valor: unknown): string {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().replace(/\s+/g, ' ').toUpperCase();
  }

  private textoCelda(valor: unknown): string {
    return String(valor ?? '').trim();
  }

  private textoFecha(valor: unknown): string {
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      return `${String(valor.getUTCDate()).padStart(2, '0')}/${String(valor.getUTCMonth() + 1).padStart(2, '0')}/${valor.getUTCFullYear()}`;
    }
    if (typeof valor === 'number') {
      const fecha = XLSX.SSF.parse_date_code(valor);
      if (fecha) return `${String(fecha.d).padStart(2, '0')}/${String(fecha.m).padStart(2, '0')}/${fecha.y}`;
    }
    return this.textoCelda(valor);
  }

  private fechaCorrecta(valor: string): boolean {
    const coincidencia = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
    if (!coincidencia) return false;
    const [, diaStr, mesStr, anioStr] = coincidencia;
    const dia = Number(diaStr);
    const mes = Number(mesStr);
    const anio = Number(anioStr);
    if (anio < 1900 || anio > 2100) return false;
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
  }

  private validar(datos: Record<CampoExcel, string>): string[] {
    const errores: string[] = [];
    COLUMNAS.filter((c) => c.obligatorio).forEach((columna) => {
      if (!datos[columna.campo]) errores.push(`Falta ${columna.encabezado}.`);
    });
    if (datos.rucEmpresa && !/^\d{11}$/.test(datos.rucEmpresa)) errores.push('El RUC debe tener 11 dígitos.');
    if (datos.fechaProgramada && !this.fechaCorrecta(datos.fechaProgramada)) errores.push('Fecha programación: utiliza dd/MM/yyyy válida.');
    if (datos.fechaNacimiento && !this.fechaCorrecta(datos.fechaNacimiento)) errores.push('Fecha nacimiento: utiliza dd/MM/yyyy válida.');

    const sede = ['CALLAO', 'COMAS', 'NOINDICA'];
    if (datos.sede && !sede.includes(this.normalizar(datos.sede).replace(/\s+/g, ''))) {
      errores.push('Sede: Callao, Comas o NoIndica.');
    }
    if ((datos.tipoDoc && !datos.nroDoc) || (!datos.tipoDoc && datos.nroDoc)) {
      errores.push('Tipo y número de documento deben consignarse juntos o dejarse ambos vacíos.');
    }
    if (datos.nroDoc) {
      const formatos: Record<string, RegExp> = {
        DNI: /^\d{8}$/,
        CE: /^[A-Z0-9]{1,13}$/,
        PASAPORTE: /^[A-Z0-9]{1,16}$/,
      };
      const tipo = this.normalizar(datos.tipoDoc);
      if (!formatos[tipo]?.test(this.normalizar(datos.nroDoc))) errores.push('Tipo y número de documento no válidos.');
    }
    if (datos.sexoCliente && !['MASCULINO', 'FEMENINO'].includes(this.normalizar(datos.sexoCliente))) {
      errores.push('Sexo: Masculino o Femenino.');
    }
    if (datos.tipoEvaluacion && ![
      'ETAS', 'OCUPACIONAL', 'PREOCUPACIONAL', 'RETIRO', 'TOXICOLOGICO', 'OTRO',
    ].includes(this.normalizar(datos.tipoEvaluacion))) errores.push('Tipo evaluación no válido.');
    if (!['REGULAR', 'PREFERENCIAL', 'VIP'].includes(this.normalizar(datos.tipoAtencion))) {
      errores.push('Tipo atención: Regular, Preferencial o VIP.');
    }
    if (!['NORMAL', 'ALTA'].includes(this.normalizar(datos.prioridad))) errores.push('Prioridad: Normal o Alta.');
    if (datos.observaciones.length > 200) errores.push('Observaciones: máximo 200 caracteres.');
    return errores;
  }
}
