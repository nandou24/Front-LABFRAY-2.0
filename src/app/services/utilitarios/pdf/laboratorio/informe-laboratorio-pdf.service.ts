import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  IInformeEntregable,
  IItemInformeEntrega,
  IPruebaInformeEntrega,
  IReferenciaAplicadaEntrega,
} from '../../../../models/Gestion/entregaResultadoLaboratorio.models';

type ModoInformePdf = 'DIGITAL' | 'IMPRESION';
type IndicadorResultado = 'ALTO' | 'BAJO' | '';

@Injectable({ providedIn: 'root' })
export class InformeLaboratorioPdfService {
  // ====== Imprimir con encabezado opcional ======
  async imprimir(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
    incluirLogo = true,
  ): Promise<void> {
    const ventana = window.open('', '_blank');

    try {
      const doc = await this.construirDocumento(
        informe,
        pruebas,
        'IMPRESION',
        incluirLogo,
      );
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
    const doc = await this.construirDocumento(informe, pruebas, 'DIGITAL', true);
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
    incluirLogoImpresion: boolean,
  ): Promise<jsPDF> {
    if (!pruebas.length) {
      throw new Error('Debe seleccionar al menos un resultado para el informe');
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const margen = 16;
    const margenInferiorTabla = modo === 'DIGITAL' ? 29 : 20;
    const encabezadoImpresion =
      modo === 'IMPRESION' && incluirLogoImpresion
        ? await this.cargarImagen('/images/Encabezado.jpg')
        : null;
    const margenSuperiorNuevaPagina = 50;

    this.aplicarPlantillaPagina(doc, modo);

    let y = this.dibujarCabeceraPrincipal(
      doc,
      informe,
      modo,
      encabezadoImpresion,
    );

    // ====== Pruebas liberadas seleccionadas ======
    pruebas.forEach((prueba) => {
      const limiteInicioPrueba = modo === 'DIGITAL' ? altoPagina - 48 : altoPagina - 38;

      if (y > limiteInicioPrueba) {
        doc.addPage();
        this.aplicarPlantillaPagina(doc, modo);
        this.aplicarEncabezadoImpresionPagina(
          doc,
          modo,
          encabezadoImpresion,
        );
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

      if (prueba.metodo) {
        doc.text(`Método: ${prueba.metodo}`, margen, y);
        y += 3.8;
      }

      doc.text(
        `Fecha de validación: ${this.formatearFechaHoraValor(prueba.fechaValidacion)}`,
        margen,
        y,
      );
      y += 2.3;

      const filas = prueba.items.map((item) => {
        const indicador = this.indicador(item);

        return {
          determinacion: item.nombreInforme,
          resultado:
            item.valor === null || item.valor === undefined
              ? '-'
              : String(item.valor),
          referencia: this.referencias(item),
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
        theme: 'plain',
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
          lineWidth: 0,
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
          fillColor: false,
          overflow: 'linebreak',
          valign: 'middle',
        },
        headStyles: {
          fontStyle: 'bold',
          textColor: [0, 0, 0],
          fillColor: false,
          lineWidth: 0,
          valign: 'middle',
        },
        columnStyles: {
          determinacion: { cellWidth: 58, halign: 'left' },
          resultado: { cellWidth: 28, halign: 'center' },
          referencia: { cellWidth: 66, halign: 'center' },
          unidad: { cellWidth: 26, halign: 'center' },
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
          // ====== Solo separadores horizontales ======
          const esCabecera = data.section === 'head';
          const esCuerpo = data.section === 'body';

          if (esCabecera || esCuerpo) {
            doc.setDrawColor(esCabecera ? 90 : 190);
            doc.setLineWidth(esCabecera ? 0.3 : 0.12);
            doc.line(
              data.cell.x,
              data.cell.y + data.cell.height,
              data.cell.x + data.cell.width,
              data.cell.y + data.cell.height,
            );
          }

          if (!esCuerpo || data.column.dataKey !== 'resultado') {
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
            Math.max(5, data.cell.width - 12),
          );
          const centroX = data.cell.x + data.cell.width / 2;
          const inicioTexto = centroX - anchoTexto / 2;
          const finTexto = centroX + anchoTexto / 2;
          const ySubrayado = data.cell.y + data.cell.height / 2 + 2.6;

          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.25);
          doc.line(inicioTexto, ySubrayado, finTexto, ySubrayado);

          if (raw.indicador) {
            const xFlecha = Math.min(
              data.cell.x + data.cell.width - 3.5,
              finTexto + 4,
            );

            this.dibujarFlecha(
              doc,
              xFlecha,
              data.cell.y + data.cell.height / 2,
              raw.indicador,
              modo,
            );
          }
        },
        willDrawPage: (data) => {
          if (data.pageNumber > 1) {
            this.aplicarPlantillaPagina(doc, modo);
            this.aplicarEncabezadoImpresionPagina(
          doc,
          modo,
          encabezadoImpresion,
        );
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
        doc.setDrawColor(190);
        doc.setLineWidth(0.15);
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

  // ====== Encabezado opcional para impresión ======
  private aplicarEncabezadoImpresionPagina(
    doc: jsPDF,
    modo: ModoInformePdf,
    encabezado: string | null,
  ): void {
    if (modo !== 'IMPRESION' || !encabezado) {
      return;
    }

    doc.addImage(encabezado, 'JPEG', 18.1, 13.9, 159.64, 24.13);
  }

  // ====== Cabecera clínica compacta ======
  private dibujarCabeceraPrincipal(
    doc: jsPDF,
    informe: IInformeEntregable,
    modo: ModoInformePdf,
    logo: string | null,
  ): number {
    const anchoPagina = doc.internal.pageSize.getWidth();
    const margen = 16;
    let y = modo === 'DIGITAL' ? 43 : 25;

    this.aplicarEncabezadoImpresionPagina(doc, modo, logo);

    const paciente = informe.solicitud.paciente;
    const fechaAtencion =
      informe.solicitud.fechaAtencion || informe.solicitud.fechaEmision;
    const edad = this.calcularEdad(
      paciente.fechaNacimiento,
      fechaAtencion,
    );

    doc.setTextColor(0, 0, 0);
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
    doc.text(informe.solicitud.codSolicitud || '-', margen + 22, y);
    y += 4.5;

    doc.setDrawColor(145);
    doc.setLineWidth(0.2);
    doc.line(margen, y, anchoPagina - margen, y);

    return y + 5;
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
    doc.text(valorIzquierda, xIzquierda + 22, y, {
      maxWidth: Math.max(35, xDerecha - (xIzquierda + 27)),
    });

    doc.setFont('helvetica', 'bold');
    doc.text(etiquetaDerecha, xDerecha, y);
    doc.setFont('helvetica', 'normal');
    doc.text(valorDerecha, xDerecha + 27, y, { maxWidth: 50 });

    return y + 5;
  }

  // ====== Indicador clínico ======
  private indicador(item: IItemInformeEntrega): IndicadorResultado {
    const estado = item.evaluacionReferencia?.estado || '';
    const aplicada = item.evaluacionReferencia?.referenciaAplicada ?? null;
    const descripcion = String(aplicada?.descripcion ?? '').trim().toUpperCase();

    // ====== Normal no lleva indicador ======
    if (/\b(NORMAL|DESEABLE)\b/.test(descripcion)) return '';

    if (estado === 'ALTO') return 'ALTO';
    if (estado === 'BAJO') return 'BAJO';

    // ====== Resolver desvío respecto de la banda normal ======
    const direccionPorNormal = this.direccionRespectoReferenciaNormal(item);
    if (direccionPorNormal) return direccionPorNormal;

    if (/\b(ALTO|ELEVADO|INTERMEDIO|L[IÍ]MITE ALTO|CR[IÍ]TICO)\b/.test(descripcion)) {
      return 'ALTO';
    }
    if (/\b(BAJO|DISMINUIDO|L[IÍ]MITE BAJO)\b/.test(descripcion)) return 'BAJO';

    return '';
  }

  private direccionRespectoReferenciaNormal(
    item: IItemInformeEntrega,
  ): IndicadorResultado {
    const valor = Number(item.valor);
    if (!Number.isFinite(valor)) return '';

    const normales = (item.referenciasConfiguradas || []).filter((referencia) =>
      /\b(NORMAL|DESEABLE)\b/.test(
        String(referencia.descripcion ?? '').trim().toUpperCase(),
      ),
    );

    for (const referencia of normales) {
      const direccion = this.compararConReferenciaNormal(valor, referencia);
      if (direccion) return direccion;
    }

    return '';
  }

  private compararConReferenciaNormal(
    valor: number,
    referencia: IReferenciaAplicadaEntrega,
  ): IndicadorResultado {
    const tipo = referencia.tipoReferencia;

    if (tipo === 'RANGO') {
      const minimo = Number(referencia.valorMin);
      const maximo = Number(referencia.valorMax);
      if (Number.isFinite(minimo) && valor < minimo) return 'BAJO';
      if (Number.isFinite(maximo) && valor > maximo) return 'ALTO';
      return '';
    }

    const limite = Number(referencia.valorLimite);
    if (!Number.isFinite(limite)) return '';

    if (tipo === 'MENOR_QUE') return valor >= limite ? 'ALTO' : '';
    if (tipo === 'MENOR_IGUAL_QUE') return valor > limite ? 'ALTO' : '';
    if (tipo === 'MAYOR_QUE') return valor <= limite ? 'BAJO' : '';
    if (tipo === 'MAYOR_IGUAL_QUE') return valor < limite ? 'BAJO' : '';

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

  // ====== Reconstruir referencias configuradas del Item ======
  private referencias(item: IItemInformeEntrega): string {
    const configuradas = item.referenciasConfiguradas || [];

    if (configuradas.length) {
      return configuradas
        .map((referencia) => this.formatearReferencia(referencia, true))
        .filter(Boolean)
        .join('\n');
    }

    const aplicada = item.evaluacionReferencia?.referenciaAplicada;
    return aplicada ? this.formatearReferencia(aplicada, true) : '';
  }

  private formatearReferencia(
    referencia: IReferenciaAplicadaEntrega,
    incluirDescripcion: boolean,
  ): string {
    const descripcion = String(referencia.descripcion || '').trim();
    let valor = '';

    switch (referencia.tipoReferencia) {
      case 'RANGO':
        if (this.tieneNumero(referencia.valorMin) && this.tieneNumero(referencia.valorMax)) {
          valor = `${referencia.valorMin} - ${referencia.valorMax}`;
        }
        break;

      case 'MENOR_QUE':
        if (this.tieneNumero(referencia.valorLimite)) valor = `< ${referencia.valorLimite}`;
        break;

      case 'MENOR_IGUAL_QUE':
        if (this.tieneNumero(referencia.valorLimite)) valor = `<= ${referencia.valorLimite}`;
        break;

      case 'MAYOR_QUE':
        if (this.tieneNumero(referencia.valorLimite)) valor = `> ${referencia.valorLimite}`;
        break;

      case 'MAYOR_IGUAL_QUE':
        if (this.tieneNumero(referencia.valorLimite)) valor = `>= ${referencia.valorLimite}`;
        break;

      case 'VALORES_PERMITIDOS':
        valor = (referencia.valoresPermitidos || []).join(', ');
        break;

      case 'TEXTO':
        valor = String(referencia.textoReferencia || '').trim();
        break;
    }

    if (incluirDescripcion && descripcion && valor) return `${descripcion}: ${valor}`;
    return valor || descripcion;
  }

  private tieneNumero(valor: number | null | undefined): valor is number {
    return valor !== null && valor !== undefined && Number.isFinite(Number(valor));
  }

  private dibujarFlecha(
    doc: jsPDF,
    x: number,
    y: number,
    direccion: 'ALTO' | 'BAJO',
    modo: ModoInformePdf,
  ): void {
    // ====== Color solo para versión digital ======
    if (modo === 'DIGITAL') {
      if (direccion === 'ALTO') {
        doc.setDrawColor(190, 45, 45);
      } else {
        doc.setDrawColor(25, 90, 170);
      }
    } else {
      doc.setDrawColor(0, 0, 0);
    }

    doc.setLineWidth(0.3);

    // ====== Flecha compacta ======
    const medioLargo = 1.1;
    const anchoPunta = 0.75;
    const retrocesoPunta = 0.55;

    if (direccion === 'ALTO') {
      doc.line(x, y + medioLargo, x, y - medioLargo);
      doc.line(
        x,
        y - medioLargo,
        x - anchoPunta,
        y - medioLargo + retrocesoPunta,
      );
      doc.line(
        x,
        y - medioLargo,
        x + anchoPunta,
        y - medioLargo + retrocesoPunta,
      );
      return;
    }

    doc.line(x, y - medioLargo, x, y + medioLargo);
    doc.line(
      x,
      y + medioLargo,
      x - anchoPunta,
      y + medioLargo - retrocesoPunta,
    );
    doc.line(
      x,
      y + medioLargo,
      x + anchoPunta,
      y + medioLargo - retrocesoPunta,
    );
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
