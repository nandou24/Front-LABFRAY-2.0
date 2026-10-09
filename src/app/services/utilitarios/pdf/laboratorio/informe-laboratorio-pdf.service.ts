import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  IInformeEntregable,
  IItemInformeEntrega,
  IPruebaInformeEntrega,
  IReferenciaAplicadaEntrega,
  ValorInformeEntrega,
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

  // ====== Generar archivo digital sin iniciar descarga ======
  async generarArchivoDigital(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
  ): Promise<{ nombreArchivo: string; blob: Blob }> {
    const doc = await this.construirDocumento(informe, pruebas, 'DIGITAL', true);

    return {
      nombreArchivo: this.construirNombreArchivoInforme(informe),
      blob: doc.output('blob'),
    };
  }

  // ====== Descargar con membrete digital ======
  async descargar(
    informe: IInformeEntregable,
    pruebas: IPruebaInformeEntrega[],
  ): Promise<void> {
    const doc = await this.construirDocumento(informe, pruebas, 'DIGITAL', true);
    doc.save(this.construirNombreArchivoInforme(informe));
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
    const logoImpresion =
      modo === 'IMPRESION' && incluirLogoImpresion
        ? await this.cargarImagen('/images/logo labfray.png')
        : null;
    const margenSuperiorContinuacion = 86;

    this.aplicarPlantillaPagina(doc, modo);

    let y = this.dibujarCabeceraPrincipal(
      doc,
      informe,
      modo,
      logoImpresion,
    );

    // ====== Pruebas liberadas seleccionadas ======
    pruebas.forEach((prueba) => {
      const limiteInicioPrueba = modo === 'DIGITAL' ? altoPagina - 48 : altoPagina - 38;

      if (y > limiteInicioPrueba) {
        doc.addPage();
        this.aplicarPlantillaPagina(doc, modo);
        y = this.dibujarCabeceraPrincipal(doc, informe, modo, logoImpresion);
      }

      y = this.dibujarCabeceraPrueba(
        doc,
        prueba,
        y,
        margen,
        anchoPagina,
      );

      const mostrarValorReferencial = this.mostrarColumnaReferencia(prueba);

      const filas = prueba.items.map((item) => {
        const indicador = this.indicador(item);

        return {
          determinacion: item.nombreInforme,
          muestra: item.muestra || '',
          metodo: item.metodo || '',
          resultado: this.formatearValorResultado(item),
          hallazgosResultado: this.obtenerHallazgosResultado(item),
          referencia: this.referencias(item),
          unidad: item.unidadesRef || '',
          indicador,
          fueraReferencia: this.fueraReferencia(item, indicador),
        };
      });

      // ====== Filas compatibles con RowInput de jspdf-autotable ======
      const filasTabla = filas.map((fila, indiceFila) => ({
        __indiceFila: String(indiceFila),
        determinacion: fila.determinacion,
        resultado: fila.resultado,
        referencia: fila.referencia,
        espacioReferencia: '',
        unidad: fila.unidad,
      }));

      autoTable(doc, {
        startY: y + 1,
        margin: {
          top: margenSuperiorContinuacion,
          bottom: margenInferiorTabla,
          left: margen,
          right: margen,
        },
        theme: 'plain',
        tableWidth: 'auto',
        showHead: 'everyPage',
        columns: mostrarValorReferencial
          ? [
              { header: 'Determinación', dataKey: 'determinacion' },
              { header: 'Resultado', dataKey: 'resultado' },
              { header: 'Valor referencial', dataKey: 'referencia' },
              { header: 'Unidades', dataKey: 'unidad' },
            ]
          : [
              { header: 'Determinación', dataKey: 'determinacion' },
              { header: 'Resultado', dataKey: 'resultado' },
              { header: '', dataKey: 'espacioReferencia' },
              { header: 'Unidades', dataKey: 'unidad' },
            ],
        body: filasTabla,
        styles: {
          font: 'helvetica',
          fontSize: 8,
          textColor: [0, 0, 0],
          lineWidth: 0,
          cellPadding: { top: 1.1, right: 1.6, bottom: 1.1, left: 1.6 },
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
          halign: 'center',
        },
        columnStyles: mostrarValorReferencial
          ? {
              determinacion: { cellWidth: 60, halign: 'left' },
              resultado: { cellWidth: 56, halign: 'center' },
              referencia: { cellWidth: 42, halign: 'center' },
              unidad: { cellWidth: 20, halign: 'center' },
            }
          : {
              // ====== Conservar la misma grilla visual sin referencia ======
              determinacion: { cellWidth: 60, halign: 'left' },
              resultado: { cellWidth: 56, halign: 'center' },
              espacioReferencia: { cellWidth: 42, halign: 'center' },
              unidad: { cellWidth: 20, halign: 'center' },
            },
        didParseCell: (data) => {
          if (data.section !== 'body') {
            return;
          }

          // ====== Resolver fila original incluso si autoTable divide una fila ======
          const filaTabla = data.row.raw as Record<string, unknown>;
          const indiceFila = Number(filaTabla?.['__indiceFila']);
          const raw = Number.isInteger(indiceFila)
            ? filas[indiceFila]
            : filas[data.row.index];

          if (!raw) {
            return;
          }

          if (
            data.column.dataKey === 'determinacion' &&
            (raw.muestra || raw.metodo)
          ) {
            const lineasMeta = Number(Boolean(raw.muestra)) + Number(Boolean(raw.metodo));
            data.cell.styles.valign = 'top';
            data.cell.styles.cellPadding = {
              top: 1.1,
              right: 1.6,
              bottom: 1.5 + lineasMeta * 2.4,
              left: 1.6,
            };
          }

          // ====== Jerarquía tipográfica del informe ======
          if (data.column.dataKey === 'resultado') {
            data.cell.styles.fontSize = 8;

            if (raw.hallazgosResultado?.length) {
              // ====== Reservar una línea por hallazgo; se dibujan manualmente ======
              data.cell.text = raw.hallazgosResultado.map(() => ' ');
              data.cell.styles.fontStyle = 'normal';

              // ====== Dar mayor altura a Items con múltiples hallazgos ======
              if (raw.hallazgosResultado.length > 1) {
                data.cell.styles.minCellHeight = 14;
              }
            } else if (raw.fueraReferencia) {
              data.cell.styles.fontStyle = 'bold';
            }
          }

          if (data.column.dataKey === 'referencia') {
            data.cell.styles.fontSize = 6;
          }

          if (data.column.dataKey === 'unidad') {
            data.cell.styles.fontSize = 7;
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

          if (!esCuerpo) {
            return;
          }

          // ====== Resolver fila original incluso si autoTable divide una fila ======
          const filaTabla = data.row.raw as Record<string, unknown>;
          const indiceFila = Number(filaTabla?.['__indiceFila']);
          const raw = Number.isInteger(indiceFila)
            ? filas[indiceFila]
            : filas[data.row.index];

          if (!raw) {
            return;
          }

          // ====== Muestra y método debajo de la determinación ======
          if (
            data.column.dataKey === 'determinacion' &&
            (raw.muestra || raw.metodo)
          ) {
            const lineasNombre = Math.max(1, data.cell.text.length);
            let yMeta = data.cell.y + 2.2 + lineasNombre * 2.8 + 0.5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5.5);
            doc.setTextColor(112, 112, 112);

            if (raw.muestra) {
              doc.text(`Muestra: ${raw.muestra}`, data.cell.x + 2, yMeta, {
                maxWidth: data.cell.width - 4,
              });
              yMeta += 2.4;
            }

            if (raw.metodo) {
              doc.text(`Método: ${raw.metodo}`, data.cell.x + 2, yMeta, {
                maxWidth: data.cell.width - 4,
              });
            }

            doc.setTextColor(0, 0, 0);
          }

          if (data.column.dataKey !== 'resultado') {
            return;
          }

          if (raw.hallazgosResultado?.length) {
            const centroX = data.cell.x + data.cell.width / 2;
            const total = raw.hallazgosResultado.length;

            raw.hallazgosResultado.forEach((hallazgo, indice) => {
              const yTexto =
                data.cell.y + ((indice + 1) * data.cell.height) / (total + 1) + 0.8;
              const texto = String(hallazgo.texto || '-');

              doc.setFont(
                'helvetica',
                hallazgo.fueraReferencia ? 'bold' : 'normal',
              );
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
              doc.text(texto, centroX, yTexto, {
                align: 'center',
                maxWidth: data.cell.width - 4,
              });

              if (hallazgo.fueraReferencia) {
                const anchoTexto = Math.min(
                  doc.getTextWidth(texto),
                  Math.max(5, data.cell.width - 6),
                );
                const inicioTexto = centroX - anchoTexto / 2;
                const finTexto = centroX + anchoTexto / 2;

                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.25);
                doc.line(inicioTexto, yTexto + 1.2, finTexto, yTexto + 1.2);
              }
            });

            return;
          }

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
            const yCabecera = this.dibujarCabeceraPrincipal(
              doc,
              informe,
              modo,
              logoImpresion,
            );
            this.dibujarCabeceraPrueba(
              doc,
              prueba,
              yCabecera,
              margen,
              anchoPagina,
            );
          }
        },
      });

      y =
        ((doc as unknown as { lastAutoTable?: { finalY?: number } })
          .lastAutoTable?.finalY ?? y) + 4;

      // ====== Referencia / interpretación compartida por grupo ======
      for (const referenciaGrupo of this.comentariosGrupo(prueba)) {
        const tituloGrupo = referenciaGrupo.nombreGrupo
          ? `Referencia / interpretación · ${referenciaGrupo.nombreGrupo}:`
          : 'Referencia / interpretación:';
        const lineas = doc.splitTextToSize(
          referenciaGrupo.comentario,
          anchoPagina - margen * 2,
        );
        const altoBloque = 4 + lineas.length * 3.4 + 3;

        if (y + altoBloque > altoPagina - margenInferiorTabla) {
          doc.addPage();
          this.aplicarPlantillaPagina(doc, modo);
          y = this.dibujarCabeceraPrincipal(doc, informe, modo, logoImpresion);
          y = this.dibujarCabeceraPrueba(
            doc,
            prueba,
            y,
            margen,
            anchoPagina,
          );
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(55, 55, 55);
        doc.text(tituloGrupo, margen, y);
        y += 3.6;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(85, 85, 85);
        doc.text(lineas, margen, y);
        y += lineas.length * 3.4 + 3;
      }

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

  // ====== Logo opcional para impresión ======
  private aplicarLogoImpresionPagina(
    doc: jsPDF,
    modo: ModoInformePdf,
    logo: string | null,
  ): void {
    if (modo !== 'IMPRESION' || !logo) {
      return;
    }

    try {
      doc.addImage(logo, 'PNG', 16, 13.5, 15, 16);
    } catch {
      doc.addImage(logo, 'JPEG', 16, 13.5, 15, 16);
    }
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
    let y = 43;

    this.aplicarLogoImpresionPagina(doc, modo, logo);

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

  // ====== Cabecera de prueba ======
  private dibujarCabeceraPrueba(
    doc: jsPDF,
    prueba: IPruebaInformeEntrega,
    yInicial: number,
    margen: number,
    anchoPagina: number,
  ): number {
    let y = yInicial;

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

    const muestrasPrueba = Array.isArray(prueba.muestras)
      ? prueba.muestras.filter(Boolean)
      : [];

    if (muestrasPrueba.length > 0) {
      const lineasMuestra = doc.splitTextToSize(
        `Muestra: ${muestrasPrueba.join(', ')}`,
        anchoPagina - margen * 2,
      );
      doc.text(lineasMuestra, margen, y);
      y += lineasMuestra.length * 3.1;
    }

    doc.text(
      `Fecha de validación: ${this.formatearFechaHoraValor(prueba.fechaValidacion)}`,
      margen,
      y,
    );

    return y + 2.3;
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
    const extremos = this.extremosValorNumerico(item);
    if (!extremos) return '';

    const normales = (item.referenciasConfiguradas || []).filter((referencia) =>
      /\b(NORMAL|DESEABLE)\b/.test(
        String(referencia.descripcion ?? '').trim().toUpperCase(),
      ),
    );

    for (const referencia of normales) {
      const direccion = this.compararConReferenciaNormal(extremos, referencia);
      if (direccion) return direccion;
    }

    return '';
  }

  private extremosValorNumerico(
    item: IItemInformeEntrega,
  ): { minimo: number; maximo: number } | null {
    const valor = item.valor;

    if (typeof valor === 'number') {
      return { minimo: valor, maximo: valor };
    }

    if (!valor || typeof valor !== 'object') return null;

    if (valor.tipo === 'RANGO') {
      return { minimo: Number(valor.desde), maximo: Number(valor.hasta) };
    }

    if (
      valor.tipo !== 'MAYOR_QUE' &&
      valor.tipo !== 'MAYOR_IGUAL_QUE' &&
      valor.tipo !== 'MENOR_QUE' &&
      valor.tipo !== 'MENOR_IGUAL_QUE'
    ) {
      return null;
    }

    const limite = Number(valor.valor);
    if (!Number.isFinite(limite)) return null;

    if (valor.tipo === 'MAYOR_QUE' || valor.tipo === 'MAYOR_IGUAL_QUE') {
      return { minimo: limite, maximo: Number.POSITIVE_INFINITY };
    }

    return { minimo: Number.NEGATIVE_INFINITY, maximo: limite };
  }

  private compararConReferenciaNormal(
    valor: { minimo: number; maximo: number },
    referencia: IReferenciaAplicadaEntrega,
  ): IndicadorResultado {
    const tipo = referencia.tipoReferencia;

    if (tipo === 'RANGO') {
      const minimo = Number(referencia.valorMin);
      const maximo = Number(referencia.valorMax);
      if (Number.isFinite(minimo) && valor.minimo < minimo) return 'BAJO';
      if (Number.isFinite(maximo) && valor.maximo > maximo) return 'ALTO';
      return '';
    }

    const limite = Number(referencia.valorLimite);
    if (!Number.isFinite(limite)) return '';

    if (tipo === 'MENOR_QUE') return valor.maximo >= limite ? 'ALTO' : '';
    if (tipo === 'MENOR_IGUAL_QUE') return valor.maximo > limite ? 'ALTO' : '';
    if (tipo === 'MAYOR_QUE') return valor.minimo <= limite ? 'BAJO' : '';
    if (tipo === 'MAYOR_IGUAL_QUE') return valor.minimo < limite ? 'BAJO' : '';

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

  // ====== Hallazgos estructurados para el informe ======
  private obtenerHallazgosResultado(
    item: IItemInformeEntrega,
  ): Array<{ texto: string; fueraReferencia: boolean }> {
    const valor = item.valor;

    if (
      item.tipoResultado !== 'ESTRUCTURADO' ||
      !valor ||
      typeof valor !== 'object' ||
      Array.isArray(valor) ||
      valor.tipo !== 'HALLAZGOS' ||
      valor.modo !== 'DETALLE' ||
      !Array.isArray(valor.hallazgos)
    ) {
      return [];
    }

    const normales = new Set(
      (item.hallazgosNormales ?? [])
        .map((hallazgo) => String(hallazgo ?? '').trim().toUpperCase())
        .filter(Boolean),
    );

    return valor.hallazgos
      .map((hallazgo) => {
        const nombre = String(hallazgo?.hallazgo ?? '').trim();
        const cuantificacion = this.formatearValorInforme(hallazgo?.valor, '\n');
        const texto =
          nombre && cuantificacion !== '-'
            ? `${nombre}: ${cuantificacion}`
            : nombre || cuantificacion;

        return {
          texto: texto.toUpperCase(),
          fueraReferencia: Boolean(nombre) && !normales.has(nombre.toUpperCase()),
        };
      })
      .filter((hallazgo) => hallazgo.texto && hallazgo.texto !== '-');
  }

  // ====== Formatear resultado para informe ======
  private formatearValorResultado(item: IItemInformeEntrega): string {
    return this.formatearValorInforme(item.valor, '\n').toUpperCase();
  }

  // ====== Formatear valores complejos del informe ======
  private formatearValorInforme(
    valor: ValorInformeEntrega | unknown,
    separadorHallazgos: string,
  ): string {
    if (valor === null || valor === undefined || valor === '') return '-';
    if (typeof valor !== 'object') return String(valor);

    const dato = valor as {
      tipo?: string;
      valor?: unknown;
      desde?: unknown;
      hasta?: unknown;
      modo?: string;
      valorAusencia?: unknown;
      hallazgos?: Array<{ hallazgo?: unknown; valor?: unknown }>;
    };
    const tipo = String(dato.tipo ?? '').trim().toUpperCase();

    if (tipo === 'RANGO') {
      return `${dato.desde ?? '-'} - ${dato.hasta ?? '-'}`;
    }

    if (tipo === 'CUALITATIVO' || tipo === 'CATEGORICO') {
      const texto = String(dato.valor ?? '').trim();
      return texto || '-';
    }

    if (tipo === 'HALLAZGOS') {
      if (String(dato.modo ?? '').toUpperCase() === 'AUSENCIA') {
        const ausencia = String(dato.valorAusencia ?? '').trim();
        return ausencia || 'NO SE OBSERVAN';
      }

      const hallazgos = Array.isArray(dato.hallazgos) ? dato.hallazgos : [];
      const lineas = hallazgos
        .map((hallazgo) => {
          const nombre = String(hallazgo?.hallazgo ?? '').trim();
          const cuantificacion = this.formatearValorInforme(
            hallazgo?.valor,
            separadorHallazgos,
          );

          if (nombre && cuantificacion !== '-') return `${nombre}: ${cuantificacion}`;
          return nombre || cuantificacion;
        })
        .filter((linea) => linea && linea !== '-');

      return lineas.length ? lineas.join(separadorHallazgos) : '-';
    }

    const simbolos: Record<string, string> = {
      MAYOR_QUE: '>',
      MAYOR_IGUAL_QUE: '>=',
      MENOR_QUE: '<',
      MENOR_IGUAL_QUE: '<=',
    };

    if (simbolos[tipo]) {
      const texto = String(dato.valor ?? '').trim();
      return texto ? `${simbolos[tipo]} ${texto}` : '-';
    }

    if (Object.prototype.hasOwnProperty.call(dato, 'valor')) {
      const texto = String(dato.valor ?? '').trim();
      return texto || '-';
    }

    return '-';
  }

  // ====== Comentarios compartidos por grupo ======
  private comentariosGrupo(prueba: IPruebaInformeEntrega): Array<{
    nombreGrupo: string;
    comentario: string;
  }> {
    const salida = new Map<string, { nombreGrupo: string; comentario: string }>();

    for (const item of prueba.items) {
      const comentario = String(item.comentarioReferenciaGrupo || '').trim();
      if (!comentario) continue;
      const nombreGrupo = String(item.nombreGrupo || '').trim();
      salida.set(`${nombreGrupo}::${comentario}`, { nombreGrupo, comentario });
    }

    return [...salida.values()];
  }

  // ====== Visibilidad de referencia por prueba ======
  private mostrarColumnaReferencia(prueba: IPruebaInformeEntrega): boolean {
    return (prueba.items || []).some(
      (item) => item.mostrarReferenciaInforme !== false,
    );
  }

  // ====== Reconstruir referencias configuradas del Item ======
  private referencias(item: IItemInformeEntrega): string {
    if (item.mostrarReferenciaInforme === false) return '—';

    const configuradas = item.referenciasConfiguradas || [];

    if (item.tipoResultado === 'CATEGORICO') {
      const esperadas = configuradas
        .filter((referencia) => referencia.tipoReferencia === 'VALORES_PERMITIDOS')
        .flatMap((referencia) => referencia.valoresPermitidos || []);
      return esperadas.length === 1 ? esperadas[0] : '-';
    }

    if (item.tipoResultado === 'TEXTO') {
      const texto = configuradas
        .filter((referencia) => referencia.tipoReferencia === 'TEXTO')
        .map((referencia) => String(referencia.textoReferencia || '').trim())
        .find(Boolean);
      return texto || '-';
    }

    if (configuradas.length) {
      const texto = configuradas
        .map((referencia) => this.formatearReferencia(referencia, true))
        .filter(Boolean)
        .join('\n');
      return texto || '-';
    }

    const aplicada = item.evaluacionReferencia?.referenciaAplicada;
    return aplicada ? this.formatearReferencia(aplicada, true) || '-' : '-';
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

  // ====== Nombre estable del PDF para descarga individual o ZIP ======
  private construirNombreArchivoInforme(informe: IInformeEntregable): string {
    const paciente = this.normalizarNombreArchivo(
      informe.solicitud.paciente.nombreCompleto || 'PACIENTE',
    );
    const solicitud = this.normalizarNombreArchivo(
      informe.solicitud.codSolicitud || 'SOLICITUD',
    );

    return `RESULTADO_${paciente}_${solicitud}_${this.fechaArchivo(new Date())}.pdf`;
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
