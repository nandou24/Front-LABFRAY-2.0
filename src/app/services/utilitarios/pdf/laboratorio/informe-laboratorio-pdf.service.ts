import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  IInformeEntregable,
  IItemInformeEntrega,
  IPruebaInformeEntrega,
} from '../../../../models/Gestion/entregaResultadoLaboratorio.models';

@Injectable({ providedIn: 'root' })
export class InformeLaboratorioPdfService {
  // ====== Imprimir informe ======
  async imprimir(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
    incluirLogo: boolean,
  ): Promise<void> {
    const ventana = window.open('', '_blank');

    try {
      const doc = await this.construirDocumento(informe, pruebas, incluirLogo);
      doc.autoPrint();

      const url = URL.createObjectURL(doc.output('blob'));

      if (ventana) {
        ventana.location.href = url;
      } else {
        window.open(url, '_blank');
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      ventana?.close();
      throw error;
    }
  }

  // ====== Descargar informe ======
  async descargar(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
    incluirLogo: boolean,
  ): Promise<void> {
    const doc = await this.construirDocumento(informe, pruebas, incluirLogo);
    const tipo = this.tipoInforme(informe, pruebas);
    const codigo =
      informe.solicitud.codigoLaboratorio || informe.solicitud.codSolicitud;

    doc.save(
      `${codigo}_${tipo}_${this.fechaArchivo(new Date())}.pdf`.replace(/\s+/g, '_'),
    );
  }

  // ====== Construir PDF en blanco y negro ======
  private async construirDocumento(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
    incluirLogo: boolean,
  ): Promise<jsPDF> {
    if (!pruebas.length) {
      throw new Error('Debe seleccionar al menos un resultado para el informe');
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const margen = 14;
    const tipo = this.tipoInforme(informe, pruebas);
    const esParcial = tipo === 'PARCIAL';

    let y = 14;

    // ====== Encabezado ======
    if (incluirLogo) {
      const logo = await this.cargarImagen('/images/logo labfray.png');

      if (logo) {
        try {
          doc.addImage(logo, 'PNG', margen, y, 15, 16);
        } catch {
          // Si el recurso no es PNG, intentar detección automática.
          doc.addImage(logo, 'JPEG', margen, y, 15, 16);
        }
      }
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INFORME DE RESULTADOS DE LABORATORIO', anchoPagina / 2, y + 5, {
      align: 'center',
    });

    doc.setFontSize(10);
    doc.text(`INFORME ${tipo}`, anchoPagina / 2, y + 11, { align: 'center' });

    y += 22;

    doc.setDrawColor(90);
    doc.setLineWidth(0.25);
    doc.line(margen, y, anchoPagina - margen, y);
    y += 5;

    // ====== Identificación ======
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Paciente:', margen, y);
    doc.setFont('helvetica', 'normal');
    doc.text(informe.solicitud.paciente.nombreCompleto || '-', margen + 18, y);

    doc.setFont('helvetica', 'bold');
    doc.text('HC:', 132, y);
    doc.setFont('helvetica', 'normal');
    doc.text(informe.solicitud.paciente.hc || '-', 140, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Documento:', margen, y);
    doc.setFont('helvetica', 'normal');
    doc.text(informe.solicitud.paciente.documento || '-', margen + 22, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Código Lab.:', 132, y);
    doc.setFont('helvetica', 'normal');
    doc.text(
      informe.solicitud.codigoLaboratorio || informe.solicitud.codSolicitud,
      151,
      y,
    );
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Solicitud:', margen, y);
    doc.setFont('helvetica', 'normal');
    doc.text(informe.solicitud.codSolicitud, margen + 18, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', 132, y);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatearFecha(informe.solicitud.fechaEmision), 143, y);
    y += 6;

    if (esParcial) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(
        `INFORME PARCIAL: ${pruebas.length} de ${informe.resumen.totalPruebas} pruebas incluidas. Existen resultados pendientes de liberar.`,
        margen,
        y,
      );
      y += 6;
    }

    // ====== Pruebas ======
    pruebas.forEach((prueba) => {
      if (y > altoPagina - 48) {
        doc.addPage();
        y = 18;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(
        `${prueba.codPruebaLab} - ${prueba.nombrePruebaLab}`,
        margen,
        y,
      );

      if (prueba.numeroInstancia > 1 || prueba.etiquetaInstancia) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(
          prueba.etiquetaInstancia || `Instancia ${prueba.numeroInstancia}`,
          anchoPagina - margen,
          y,
          { align: 'right' },
        );
      }

      y += 2;

      const filas = prueba.items.map((item) => ({
        determinacion: item.nombreInforme,
        resultado: item.valor === null || item.valor === undefined ? '-' : String(item.valor),
        unidad: item.unidadesRef || '',
        indicador: this.indicador(item),
        referencia: this.referencia(item),
      }));

      autoTable(doc, {
        startY: y + 1,
        margin: { left: margen, right: margen },
        theme: 'grid',
        tableWidth: 'auto',
        columns: [
          { header: 'Determinación', dataKey: 'determinacion' },
          { header: 'Resultado', dataKey: 'resultado' },
          { header: 'Unidad', dataKey: 'unidad' },
          { header: 'Ind.', dataKey: 'indicador' },
          { header: 'Referencia', dataKey: 'referencia' },
        ],
        body: filas,
        styles: {
          font: 'helvetica',
          fontSize: 8,
          textColor: [0, 0, 0],
          lineColor: [170, 170, 170],
          lineWidth: 0.15,
          cellPadding: 2,
          fillColor: [255, 255, 255],
        },
        headStyles: {
          fontStyle: 'bold',
          textColor: [0, 0, 0],
          fillColor: [235, 235, 235],
          lineColor: [100, 100, 100],
          lineWidth: 0.2,
        },
        columnStyles: {
          determinacion: { cellWidth: 54 },
          resultado: { cellWidth: 33, fontStyle: 'bold' },
          unidad: { cellWidth: 23 },
          indicador: { cellWidth: 12, halign: 'center' },
          referencia: { cellWidth: 52 },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.dataKey === 'indicador') {
            data.cell.text = [];
          }
        },
        didDrawCell: (data) => {
          if (data.section !== 'body' || data.column.dataKey !== 'indicador') {
            return;
          }

          const raw = data.row.raw as { indicador?: 'ALTO' | 'BAJO' | '' };
          if (!raw.indicador) return;

          this.dibujarFlecha(
            doc,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2,
            raw.indicador,
          );
        },
      });

      y = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
        ?.finalY ?? y) + 4;

      if (prueba.observacionGeneral) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        const texto = doc.splitTextToSize(
          `Observación: ${prueba.observacionGeneral}`,
          anchoPagina - margen * 2,
        );
        doc.text(texto, margen, y);
        y += texto.length * 3.6 + 2;
      }
    });

    // ====== Pie de página ======
    const paginas = doc.getNumberOfPages();
    const generado = this.formatearFechaHora(new Date());

    for (let pagina = 1; pagina <= paginas; pagina += 1) {
      doc.setPage(pagina);
      doc.setDrawColor(160);
      doc.line(margen, altoPagina - 13, anchoPagina - margen, altoPagina - 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.text(
        esParcial ? 'INFORME PARCIAL' : 'INFORME FINAL',
        margen,
        altoPagina - 8,
      );
      doc.text(`Generado: ${generado}`, anchoPagina / 2, altoPagina - 8, {
        align: 'center',
      });
      doc.text(`Página ${pagina} de ${paginas}`, anchoPagina - margen, altoPagina - 8, {
        align: 'right',
      });
    }

    return doc;
  }

  private tipoInforme(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
  ): 'PARCIAL' | 'FINAL' {
    return pruebas.length > 0 && pruebas.length === informe.resumen.totalPruebas
      ? 'FINAL'
      : 'PARCIAL';
  }

  private indicador(item: IItemInformeEntrega): 'ALTO' | 'BAJO' | '' {
    const estado = item.evaluacionReferencia?.estado || '';
    if (estado === 'ALTO') return 'ALTO';
    if (estado === 'BAJO') return 'BAJO';

    const descripcion = (
      item.evaluacionReferencia?.referenciaAplicada?.descripcion || ''
    ).toUpperCase();

    if (/\b(ALTO|ELEVADO|CR[IÍ]TICO)\b/.test(descripcion)) return 'ALTO';
    if (/\b(BAJO|DISMINUIDO)\b/.test(descripcion)) return 'BAJO';

    return '';
  }

  private referencia(item: IItemInformeEntrega): string {
    const descripcion =
      item.evaluacionReferencia?.referenciaAplicada?.descripcion?.trim() || '';

    return descripcion;
  }

  private dibujarFlecha(
    doc: jsPDF,
    x: number,
    y: number,
    direccion: 'ALTO' | 'BAJO',
  ): void {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);

    if (direccion === 'ALTO') {
      doc.line(x, y + 2.5, x, y - 2.5);
      doc.line(x, y - 2.5, x - 1.5, y - 0.8);
      doc.line(x, y - 2.5, x + 1.5, y - 0.8);
      return;
    }

    doc.line(x, y - 2.5, x, y + 2.5);
    doc.line(x, y + 2.5, x - 1.5, y + 0.8);
    doc.line(x, y + 2.5, x + 1.5, y + 0.8);
  }

  private formatearFecha(valor: string | Date | null | undefined): string {
    if (!valor) return '-';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '-';

    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(fecha);
  }

  private formatearFechaHora(valor: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(valor);
  }

  private fechaArchivo(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}${mes}${dia}`;
  }

  private async cargarImagen(url: string): Promise<string | null> {
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) return null;

      const blob = await respuesta.blob();

      return await new Promise<string>((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(String(lector.result));
        lector.onerror = () => reject(lector.error);
        lector.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
}
