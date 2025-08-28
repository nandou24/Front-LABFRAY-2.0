import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { IPago } from '../../../models/Gestion/pagos.models';
import {
  IArqueoCaja,
  IDetalleMovimientoArqueo,
} from '../../../models/Caja/arqueo.models';

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  constructor() {}

  /**
   * Exporta los datos de pagos a un archivo Excel
   * @param datos Array de pagos a exportar
   * @param nombreArchivo Nombre del archivo (sin extensión)
   * @param estadisticas Estadísticas del reporte para incluir en una hoja separada
   */
  exportarPagosAExcel(
    datos: IPago[],
    nombreArchivo: string = 'reporte-pagos',
    estadisticas?: any,
  ): void {
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Preparar datos de pagos para la primera hoja
    const datosPagos = this.prepararDatosPagos(datos);

    // Crear hoja de pagos
    const worksheetPagos = XLSX.utils.json_to_sheet(datosPagos);

    // Configurar el ancho de las columnas
    const anchosColumnas = [
      { wch: 15 }, // Cotización
      { wch: 15 }, // Código Pago
      { wch: 25 }, // Cliente
      { wch: 12 }, // Documento
      { wch: 15 }, // Total Facturar
      { wch: 15 }, // Total Pagado
      { wch: 15 }, // Falta Pagar
      { wch: 15 }, // Medio de Pago
      { wch: 12 }, // Monto
      { wch: 12 }, // Recargo
      { wch: 18 }, // Monto Total (con recargo)
      { wch: 15 }, // Fecha Pago
      { wch: 15 }, // Nro Operación
      { wch: 12 }, // Estado
      { wch: 25 }, // Referencia Médica
    ];
    worksheetPagos['!cols'] = anchosColumnas;

    // Agregar la hoja de pagos al libro
    XLSX.utils.book_append_sheet(workbook, worksheetPagos, 'Pagos');

    // Si se proporcionan estadísticas, crear una segunda hoja
    if (estadisticas) {
      const datosEstadisticas = this.prepararDatosEstadisticas(estadisticas);
      const worksheetEstadisticas = XLSX.utils.json_to_sheet(datosEstadisticas);

      // Configurar ancho para estadísticas
      worksheetEstadisticas['!cols'] = [
        { wch: 25 }, // Concepto
        { wch: 20 }, // Valor
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        worksheetEstadisticas,
        'Estadísticas',
      );
    }

    // Generar archivo y descargarlo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreCompleto = `${nombreArchivo}_${fecha}.xlsx`;

    XLSX.writeFile(workbook, nombreCompleto);
  }

  /**
   * Prepara los datos de pagos para exportación, incluyendo detalles de cada pago
   */
  private prepararDatosPagos(datos: IPago[]): any[] {
    const filas: any[] = [];

    datos.forEach((pago) => {
      // Si el pago tiene detalles, crear una fila por cada detalle
      if (pago.detallePagos && pago.detallePagos.length > 0) {
        pago.detallePagos.forEach((detalle) => {
          filas.push({
            Cotización: pago.codCotizacion || '',
            'Código Pago': pago.codPago || '',
            Cliente:
              `${pago.nombreCliente || ''} ${pago.apePatCliente || ''} ${pago.apeMatCliente || ''}`.trim(),
            Documento: pago.nroDoc || '',
            'Total Facturar': pago.totalFacturar || pago.total || 0,
            'Total Pagado': this.calcularTotalPagado(pago),
            'Falta Pagar': pago.faltaPagar || 0,
            'Medio de Pago': detalle.medioPago || '',
            Monto: detalle.monto || 0,
            Recargo: detalle.recargo || 0,
            'Monto Total (con recargo)':
              (detalle.monto || 0) + (detalle.recargo || 0),
            'Fecha Pago': detalle.fechaPago
              ? new Date(detalle.fechaPago).toLocaleDateString('es-PE')
              : '',
            'Nro Operación': detalle.numOperacion || '',
            Estado: pago.estadoPago || '',
            'Referencia Médica':
              `${pago.nombreRefMedico || ''} ${pago.apePatRefMedico || ''} ${pago.apeMatRefMedico || ''}`.trim(),
          });
        });
      } else {
        // Si no tiene detalles, crear una fila básica del pago
        filas.push({
          Cotización: pago.codCotizacion || '',
          'Código Pago': pago.codPago || '',
          Cliente:
            `${pago.nombreCliente || ''} ${pago.apePatCliente || ''} ${pago.apeMatCliente || ''}`.trim(),
          Documento: pago.nroDoc || '',
          'Total Facturar': pago.totalFacturar || pago.total || 0,
          'Total Pagado': this.calcularTotalPagado(pago),
          'Falta Pagar': pago.faltaPagar || 0,
          'Medio de Pago': '',
          Monto: 0,
          Recargo: 0,
          'Monto Total (con recargo)': 0,
          'Fecha Pago': '',
          'Nro Operación': '',
          Estado: pago.estadoPago || '',
          'Referencia Médica':
            `${pago.nombreRefMedico || ''} ${pago.apePatRefMedico || ''} ${pago.apeMatRefMedico || ''}`.trim(),
        });
      }
    });

    return filas;
  }

  /**
   * Prepara los datos de estadísticas para exportación
   */
  private prepararDatosEstadisticas(estadisticas: any): any[] {
    const filas = [
      { Concepto: 'Total de Pagos', Valor: estadisticas.totalPagos },
      {
        Concepto: 'Monto Total',
        Valor: `S/ ${estadisticas.montoTotal.toFixed(2)}`,
      },
      {
        Concepto: 'Monto Pagado',
        Valor: `S/ ${estadisticas.montoPagado.toFixed(2)}`,
      },
      {
        Concepto: 'Monto Faltante',
        Valor: `S/ ${estadisticas.montoFaltante.toFixed(2)}`,
      },
      { Concepto: 'Pagos Completos', Valor: estadisticas.pagosCompletos },
      { Concepto: 'Pagos Pendientes', Valor: estadisticas.pagosPendientes },
      { Concepto: '', Valor: '' }, // Fila vacía como separador
      { Concepto: 'INGRESOS POR MEDIO DE PAGO', Valor: '' },
    ];

    // Agregar ingresos por medio de pago
    Object.entries(estadisticas.ingresosPorMedioPago).forEach(
      ([medio, monto]) => {
        filas.push({
          Concepto: medio,
          Valor: `S/ ${(monto as number).toFixed(2)}`,
        });
      },
    );

    return filas;
  }

  /**
   * Calcula el total pagado sumando todos los detalles de pago
   */
  private calcularTotalPagado(pago: IPago): number {
    if (!pago.detallePagos || pago.detallePagos.length === 0) {
      return 0;
    }

    return pago.detallePagos.reduce((total, detalle) => {
      return total + (detalle.monto || 0) + (detalle.recargo || 0);
    }, 0);
  }

  /**
   * Exporta datos simples a Excel (para uso general)
   */
  exportarDatosSimples(
    datos: any[],
    nombreArchivo: string,
    nombreHoja: string = 'Datos',
  ): void {
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);

    const fecha = new Date().toISOString().split('T')[0];
    const nombreCompleto = `${nombreArchivo}_${fecha}.xlsx`;

    XLSX.writeFile(workbook, nombreCompleto);
  }

  /**
   * Exporta un arqueo de caja específico a Excel
   * @param arqueo Datos del arqueo a exportar
   * @param movimientos Movimientos de efectivo del arqueo
   * @param nombreArchivo Nombre del archivo (sin extensión)
   */
  exportarArqueoAExcel(
    arqueo: IArqueoCaja,
    movimientos: IDetalleMovimientoArqueo[],
    nombreArchivo: string = 'arqueo-caja',
  ): void {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Resumen del Arqueo
    const datosArqueo = [
      { Concepto: 'Código de Arqueo', Valor: arqueo.codArqueo },
      {
        Concepto: 'Fecha',
        Valor: new Date(arqueo.fecha).toLocaleDateString('es-PE'),
      },
      { Concepto: 'Turno', Valor: arqueo.turno },
      { Concepto: 'Sede', Valor: arqueo.sede },
      { Concepto: 'Usuario', Valor: arqueo.usuarioArqueo },
      { Concepto: '', Valor: '' },
      { Concepto: 'MONTOS', Valor: '' },
      {
        Concepto: 'Monto Apertura',
        Valor: `S/ ${arqueo.montoApertura.toFixed(2)}`,
      },
      {
        Concepto: 'Monto Sistema',
        Valor: `S/ ${arqueo.montoSistema.toFixed(2)}`,
      },
      {
        Concepto: 'Monto Físico Contado',
        Valor: `S/ ${arqueo.montoCierre.toFixed(2)}`,
      },
      { Concepto: 'Diferencia', Valor: `S/ ${arqueo.diferencia.toFixed(2)}` },
      { Concepto: 'Estado', Valor: arqueo.estado },
      { Concepto: '', Valor: '' },
      { Concepto: 'DENOMINACIONES', Valor: '' },
    ];

    // Agregar denominaciones
    if (arqueo.detalleDenominaciones) {
      arqueo.detalleDenominaciones.forEach((denom) => {
        const nombre =
          denom.tipo === 'MONEDA'
            ? `Moneda ${denom.denominacion} sol${denom.denominacion !== 1 ? 'es' : ''}`
            : `Billete ${denom.denominacion} soles`;
        datosArqueo.push({
          Concepto: `${nombre} (${denom.cantidad}x)`,
          Valor: `S/ ${denom.subtotal.toFixed(2)}`,
        });
      });
    }

    if (arqueo.observaciones) {
      datosArqueo.push({ Concepto: '', Valor: '' });
      datosArqueo.push({
        Concepto: 'Observaciones',
        Valor: arqueo.observaciones,
      });
    }

    const worksheetArqueo = XLSX.utils.json_to_sheet(datosArqueo);
    worksheetArqueo['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, worksheetArqueo, 'Resumen Arqueo');

    // Hoja 2: Movimientos de Efectivo
    if (movimientos && movimientos.length > 0) {
      const datosMovimientos = movimientos.map((mov) => ({
        'Código Pago': mov.codPago,
        'Código Cotización': mov.codCotizacion,
        'Fecha Pago': new Date(mov.fechaPago).toLocaleString('es-PE'),
        Paciente: mov.nombreCompleto,
        Documento: `${mov.tipoDoc} ${mov.nroDoc}`,
        'Monto Efectivo': mov.montoEfectivo,
        Usuario: mov.usuario,
      }));

      const worksheetMovimientos = XLSX.utils.json_to_sheet(datosMovimientos);
      worksheetMovimientos['!cols'] = [
        { wch: 15 }, // Código Pago
        { wch: 15 }, // Código Cotización
        { wch: 20 }, // Fecha Pago
        { wch: 25 }, // Paciente
        { wch: 15 }, // Documento
        { wch: 15 }, // Monto Efectivo
        { wch: 15 }, // Usuario
      ];
      XLSX.utils.book_append_sheet(
        workbook,
        worksheetMovimientos,
        'Movimientos Efectivo',
      );
    }

    // Generar archivo y descargarlo
    const fecha = new Date(arqueo.fecha).toISOString().split('T')[0];
    const nombreCompleto = `${nombreArchivo}_${arqueo.codArqueo}_${fecha}.xlsx`;

    XLSX.writeFile(workbook, nombreCompleto);
  }

  /**
   * Exporta múltiples arqueos a Excel
   * @param arqueos Array de arqueos a exportar
   * @param nombreArchivo Nombre del archivo (sin extensión)
   */
  exportarArqueosAExcel(
    arqueos: IArqueoCaja[],
    nombreArchivo: string = 'historial-arqueos',
  ): void {
    const workbook = XLSX.utils.book_new();

    // Preparar datos de arqueos
    const datosArqueos = arqueos.map((arqueo) => ({
      Código: arqueo.codArqueo,
      Fecha: new Date(arqueo.fecha).toLocaleDateString('es-PE'),
      Turno: arqueo.turno,
      Sede: arqueo.sede,
      Usuario: arqueo.usuarioArqueo,
      'Monto Apertura': arqueo.montoApertura,
      'Monto Sistema': arqueo.montoSistema,
      'Monto Físico': arqueo.montoCierre,
      Diferencia: arqueo.diferencia,
      Estado: arqueo.estado,
      Observaciones: arqueo.observaciones || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosArqueos);

    // Configurar ancho de columnas
    worksheet['!cols'] = [
      { wch: 15 }, // Código
      { wch: 12 }, // Fecha
      { wch: 10 }, // Turno
      { wch: 15 }, // Sede
      { wch: 20 }, // Usuario
      { wch: 12 }, // Monto Apertura
      { wch: 12 }, // Monto Sistema
      { wch: 12 }, // Monto Físico
      { wch: 12 }, // Diferencia
      { wch: 12 }, // Estado
      { wch: 30 }, // Observaciones
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Arqueos');

    // Generar archivo y descargarlo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreCompleto = `${nombreArchivo}_${fecha}.xlsx`;

    XLSX.writeFile(workbook, nombreCompleto);
  }
}
