import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  IInformeEntregable,
  IItemInformeEntrega,
  IPruebaInformeEntrega,
} from '../../../../models/Gestion/entregaResultadoLaboratorio.models';

type ModoInformePdf = 'DIGITAL' | 'IMPRESION';
type IndicadorResultado = 'ALTO' | 'BAJO' | '';

@Injectable({ providedIn: 'root' })
export class InformeLaboratorioPdfService {
  // ====== Imprimir en plantilla blanca ======
  async imprimir(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
  ): Promise<void> {
    const ventana = window.open('', '_blank');

    try {
      const doc = await this.construirDocumento(informe, pruebas, 'IMPRESION');
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

  // ====== Descargar con membrete digital ======
  async descargar(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
  ): Promise<void> {
    const doc = await this.construirDocumento(informe, pruebas, 'DIGITAL');
    const paciente = this.normalizarNombreArchivo(
      informe.solicitud.paciente.nombreCompleto || 'PACIENTE',
    );
    const solicitud = this.normalizarNombreArchivo(
      informe.solicitud.codSolicitud || 'SOLICITUD',
    );

    doc.save(
      `RESULTADO_${paciente}_${solicitud}_${this.fechaArchivo(new Date())}.pdf`,
    );
  }

  // ====== Construir informe ======
  private async construirDocumento(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
    modo: ModoInformePdf,
  ): Promise<jsPDF> {
    if (!pruebas.length) {
      throw new Error('Debe seleccionar al menos un resultado para el informe');
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const margen = modo === 'DIGITAL' ? 16 : 14;
    const margenInferiorTabla = modo === 'DIGITAL' ? 29 : 20;
    const margenSuperiorNuevaPagina = modo === 'DIGITAL' ? 42 : 18;
    const logo =
      modo === 'IMPRESION'
        ? await this.cargarImagen('/images/logo labfray.png')
        : null;
    const tipo = this.tipoInforme(informe, pruebas);

    this.aplicarPlantillaPagina(doc, modo);

    let y = this.dibujarCabeceraPrincipal(doc, informe, modo, logo, tipo);

    // ====== Pruebas liberadas seleccionadas ======
    pruebas.forEach((prueba) => {
      const limiteInicioPrueba = modo === 'DIGITAL' ? altoPagina - 48 : altoPagina - 38;

      if (y > limiteInicioPrueba) {
        doc.addPage();
        this.aplicarPlantillaPagina(doc, modo);
        y = margenSuperiorNuevaPagina;
      }

      doc.setTextColor(0, 0, 0);
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

      y += 4.2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(65, 65, 65);
      doc.text(
        `Fecha de validación: ${this.formatearFechaHoraValor(prueba.fechaValidacion)}`,
        margen,
        y,
      );
      y += 2;

      const filas = prueba.items.map((item) => {
        const indicador = this.indicador(item);

        return {
          determinacion: item.nombreInforme,
          resultado:
            item.valor === null || item.valor === undefined
              ? '-'
              : String(item.valor),
          referencia: this.referencia(item),
          unidad: item.unidadesRef || '',
          indicador,
          fueraReferencia: this.fueraReferencia(item, indicador),
        };
      });

      autoTable(doc, {
        startY: y + 1,
        margin: {
          top: margenSuperiorNuevaPagina,
          bottom: margenInferiorTabla,
          left: margen,
          right: margen,
        },
        theme: 'grid',
        tableWidth: 'auto',
        columns: [
          { header: 'Determinación', dataKey: 'determinacion' },
          { header: 'Resultado', dataKey: 'resultado' },
          { header: 'Valor referencial', dataKey: 'referencia' },
          { header: 'Unidades', dataKey: 'unidad' },
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
          fillColor: modo === 'DIGITAL' ? [235, 244, 248] : [240, 240, 240],
          lineColor: [100, 100, 100],
          lineWidth: 0.2,
        },
        columnStyles: {
          determinacion: { cellWidth: 62 },
          resultado: { cellWidth: 34 },
          referencia: { cellWidth: 52 },
          unidad: { cellWidth: 30 },
        },
        didParseCell: (data) => {
          if (data.section !== 'body' || data.column.dataKey !== 'resultado') {
            return;
          }

          const raw = data.row.raw as {
            fueraReferencia?: boolean;
          };

          if (raw.fueraReferencia) {
            data.cell.styles.fontStyle = 'bold';
          }
        },
        didDrawCell: (data) => {
          if (data.section !== 'body' || data.column.dataKey !== 'resultado') {
            return;
          }

          const raw = data.row.raw as {
            resultado?: string;
            indicador?: IndicadorResultado;
            fueraReferencia?: boolean;
          };

          if (!raw.fueraReferencia) {
            return;
          }

          const texto = String(raw.resultado || '-');
          const anchoTexto = Math.min(
            doc.getTextWidth(texto),
            Math.max(5, data.cell.width - 11),
          );
          const xTexto = data.cell.x + 2;
          const ySubrayado = data.cell.y + data.cell.height - 2.1;

          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.25);
          doc.line(xTexto, ySubrayado, xTexto + anchoTexto, ySubrayado);

          if (raw.indicador) {
            this.dibujarFlecha(
              doc,
              data.cell.x + data.cell.width - 5,
              data.cell.y + data.cell.height / 2,
              raw.indicador,
            );
          }
        },
        willDrawPage: (data) => {
          if (data.pageNumber > 1) {
            this.aplicarPlantillaPagina(doc, modo);
          }
        },
      });

      y =
        ((doc as unknown as { lastAutoTable?: { finalY?: number } })
          .lastAutoTable?.finalY ?? y) + 4;

      if (prueba.observacionGeneral) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(50, 50, 50);
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
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(70, 70, 70);

      if (modo === 'IMPRESION') {
        doc.setDrawColor(170);
        doc.line(margen, altoPagina - 13, anchoPagina - margen, altoPagina - 13);
        doc.text(
          `Solicitud: ${informe.solicitud.codSolicitud}`,
          margen,
          altoPagina - 8,
        );
        doc.text(`Generado: ${generado}`, anchoPagina / 2, altoPagina - 8, {
          align: 'center',
        });
        doc.text(
          `Página ${pagina} de ${paginas}`,
          anchoPagina - margen,
          altoPagina - 8,
          { align: 'right' },
        );
      } else {
        doc.text(
          `Solicitud: ${informe.solicitud.codSolicitud}`,
          margen,
          altoPagina - 24,
        );
        doc.text(`Generado: ${generado}`, anchoPagina / 2, altoPagina - 24, {
          align: 'center',
        });
        doc.text(
          `Página ${pagina} de ${paginas}`,
          anchoPagina - margen,
          altoPagina - 24,
          { align: 'right' },
        );
      }
    }

    return doc;
  }

  // ====== Plantilla según destino ======
  private aplicarPlantillaPagina(doc: jsPDF, modo: ModoInformePdf): void {
    if (modo !== 'DIGITAL') {
      return;
    }

    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();

    // ====== Reutilizar plantilla de cotización Empresa ======
    doc.setFillColor(243, 251, 254);
    doc.rect(0, 0, anchoPagina, altoPagina, 'F');
    doc.addImage('/images/logoFondo.jpg', 'JPEG', 60, 80, 145.03, 175.13);
    doc.addImage('/images/superior.jpg', 'JPEG', 0, 0, 210, 19.03);
    doc.addImage('/images/inferior.jpg', 'JPEG', 0, 277.97, 210, 19.03);
    doc.addImage('/images/Encabezado.jpg', 'JPEG', 18.1, 13.9, 159.64, 24.13);
  }

  // ====== Cabecera clínica ======
  private dibujarCabeceraPrincipal(
    doc: jsPDF,
    informe: IInformeEntregable,
    modo: ModoInformePdf,
    logo: string | null,
    tipo: 'PARCIAL' | 'FINAL',
  ): number {
    const anchoPagina = doc.internal.pageSize.getWidth();
    const margen = modo === 'DIGITAL' ? 16 : 14;
    let y = modo === 'DIGITAL' ? 44 : 14;

    if (modo === 'IMPRESION' && logo) {
      try {
        doc.addImage(logo, 'PNG', margen, y, 15, 16);
      } catch {
        doc.addImage(logo, 'JPEG', margen, y, 15, 16);
      }
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const yTitulo = modo === 'DIGITAL' ? y : y + 5;

    doc.text(
      'INFORME DE RESULTADOS DE LABORATORIO',
      anchoPagina / 2,
      yTitulo,
      { align: 'center' },
    );

    doc.setFontSize(8.5);
    doc.text(`INFORME ${tipo}`, anchoPagina / 2, yTitulo + 5, {
      align: 'center',
    });

    y = modo === 'DIGITAL' ? y + 11 : y + 27;

    doc.setDrawColor(90);
    doc.setLineWidth(0.25);
    doc.line(margen, y, anchoPagina - margen, y);
    y += 5;

    const paciente = informe.solicitud.paciente;
    const fechaAtencion =
      informe.solicitud.fechaAtencion || informe.solicitud.fechaEmision;
    const edad = this.calcularEdad(
      paciente.fechaNacimiento,
      fechaAtencion,
    );

    doc.setFontSize(8.3);
    y = this.dibujarDatoDoble(
      doc,
      y,
      margen,
      'Paciente:',
      paciente.nombreCompleto || '-',
      127,
      'HC:',
      paciente.hc || '-',
    );
    y = this.dibujarDatoDoble(
      doc,
      y,
      margen,
      'Documento:',
      paciente.documento || '-',
      127,
      'Sexo:',
      this.formatearSexo(paciente.sexo),
    );
    y = this.dibujarDatoDoble(
      doc,
      y,
      margen,
      'Edad:',
      edad,
      127,
      'Fecha atención:',
      this.formatearFecha(fechaAtencion),
    );

    doc.setFont('helvetica', 'bold');
    doc.text('Solicitud:', margen, y);
    doc.setFont('helvetica', 'normal');
    doc.text(informe.solicitud.codSolicitud || '-', margen + 18, y);
    y += 5;

    doc.setDrawColor(150);
    doc.line(margen, y, anchoPagina - margen, y);

    return y + 6;
  }

  private dibujarDatoDoble(
    doc: jsPDF,
    y: number,
    xIzquierda: number,
    etiquetaIzquierda: string,
    valorIzquierda: string,
    xDerecha: number,
    etiquetaDerecha: string,
    valorDerecha: string,
  ): number {
    doc.setFont('helvetica', 'bold');
    doc.text(etiquetaIzquierda, xIzquierda, y);
    doc.setFont('helvetica', 'normal');
    doc.text(valorIzquierda, xIzquierda + 22, y, { maxWidth: 82 });

    doc.setFont('helvetica', 'bold');
    doc.text(etiquetaDerecha, xDerecha, y);
    doc.setFont('helvetica', 'normal');
    doc.text(valorDerecha, xDerecha + 27, y, { maxWidth: 50 });

    return y + 5;
  }


  private tipoInforme(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
  ): 'PARCIAL' | 'FINAL' {
    return pruebas.length > 0 && pruebas.length === informe.resumen.totalPruebas
      ? 'FINAL'
      : 'PARCIAL';
  }

  // ====== Indicador clínico ======
  private indicador(item: IItemInformeEntrega): IndicadorResultado {
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

  private fueraReferencia(
    item: IItemInformeEntrega,
    indicador: IndicadorResultado,
  ): boolean {
    const estado = item.evaluacionReferencia?.estado || '';

    return (
      !!indicador ||
      ['FUERA_REFERENCIA', 'VALOR_NO_PERMITIDO'].includes(estado)
    );
  }

  // ====== Mostrar el valor referencial real ======
  private referencia(item: IItemInformeEntrega): string {
    const referencia = item.evaluacionReferencia?.referenciaAplicada;

    if (!referencia) {
      return '';
    }

    switch (referencia.tipoReferencia) {
      case 'RANGO':
        return this.tieneNumero(referencia.valorMin) &&
          this.tieneNumero(referencia.valorMax)
          ? `${referencia.valorMin} - ${referencia.valorMax}`
          : referencia.descripcion?.trim() || '';

      case 'MENOR_QUE':
        return this.tieneNumero(referencia.valorLimite)
          ? `< ${referencia.valorLimite}`
          : referencia.descripcion?.trim() || '';

      case 'MENOR_IGUAL_QUE':
        return this.tieneNumero(referencia.valorLimite)
          ? `<= ${referencia.valorLimite}`
          : referencia.descripcion?.trim() || '';

      case 'MAYOR_QUE':
        return this.tieneNumero(referencia.valorLimite)
          ? `> ${referencia.valorLimite}`
          : referencia.descripcion?.trim() || '';

      case 'MAYOR_IGUAL_QUE':
        return this.tieneNumero(referencia.valorLimite)
          ? `>= ${referencia.valorLimite}`
          : referencia.descripcion?.trim() || '';

      case 'VALORES_PERMITIDOS':
        return (referencia.valoresPermitidos || []).join(', ');

      case 'TEXTO':
        return referencia.textoReferencia?.trim() || '';

      default:
        return referencia.descripcion?.trim() || '';
    }
  }

  private tieneNumero(valor: number | null | undefined): valor is number {
    return valor !== null && valor !== undefined && Number.isFinite(Number(valor));
  }

  private dibujarFlecha(
    doc: jsPDF,
    x: number,
    y: number,
    direccion: 'ALTO' | 'BAJO',
  ): void {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);

    if (direccion === 'ALTO') {
      doc.line(x, y + 2.5, x, y - 2.5);
      doc.line(x, y - 2.5, x - 1.6, y - 0.7);
      doc.line(x, y - 2.5, x + 1.6, y - 0.7);
      return;
    }

    doc.line(x, y - 2.5, x, y + 2.5);
    doc.line(x, y + 2.5, x - 1.6, y + 0.7);
    doc.line(x, y + 2.5, x + 1.6, y + 0.7);
  }

  // ====== Edad al momento de la atención ======
  private calcularEdad(
    fechaNacimiento: string | null | undefined,
    fechaAtencion: string | null | undefined,
  ): string {
    if (!fechaNacimiento || !fechaAtencion) {
      return '-';
    }

    const nacimiento = new Date(fechaNacimiento);
    const atencion = new Date(fechaAtencion);

    if (
      Number.isNaN(nacimiento.getTime()) ||
      Number.isNaN(atencion.getTime())
    ) {
      return '-';
    }

    let edad = atencion.getUTCFullYear() - nacimiento.getUTCFullYear();
    const mes = atencion.getUTCMonth() - nacimiento.getUTCMonth();

    if (
      mes < 0 ||
      (mes === 0 && atencion.getUTCDate() < nacimiento.getUTCDate())
    ) {
      edad -= 1;
    }

    return edad >= 0 ? `${edad} años` : '-';
  }

  private formatearSexo(valor: string | null | undefined): string {
    const sexo = String(valor || '').trim().toUpperCase();

    if (['MASCULINO', 'M', 'HOMBRE'].includes(sexo)) return 'MASCULINO';
    if (['FEMENINO', 'F', 'MUJER'].includes(sexo)) return 'FEMENINO';

    return sexo || '-';
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

  private formatearFechaHoraValor(
    valor: string | Date | null | undefined,
  ): string {
    if (!valor) return '-';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '-';

    return this.formatearFechaHora(fecha);
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

  private normalizarNombreArchivo(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80)
      .toUpperCase();
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
