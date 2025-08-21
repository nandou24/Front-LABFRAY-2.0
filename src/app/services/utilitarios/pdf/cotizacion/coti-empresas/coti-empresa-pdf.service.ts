import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IEmpresa } from '../../../../../models/Mantenimiento/empresa.models';
import { UbigeoService } from '../../../ubigeo.service';

@Injectable({
  providedIn: 'root',
})
export class CotiEmpresaPdfService {
  constructor(
    private _sanitizer: DomSanitizer,
    private _ubigeoService: UbigeoService,
  ) {}

  datoEmpresa = {} as IEmpresa;
  async generarPDFCotizacion(
    data: any,
    preview: boolean,
  ): Promise<SafeResourceUrl | void> {
    const doc = new jsPDF();

    doc.setFillColor(243, 251, 254);
    doc.rect(
      0,
      0,
      doc.internal.pageSize.getWidth(),
      doc.internal.pageSize.getHeight(),
      'F',
    );

    const logoFondo = '/images/logoFondo.jpg';
    doc.addImage(logoFondo, 'JPEG', 60, 80, 145.03, 175.13); // (x, y, width, height)

    const superior = '/images/superior.jpg';
    doc.addImage(superior, 'JPEG', 0, 0, 210, 19.03); // (x, y, width, height)

    const inferior = '/images/inferior.jpg';
    doc.addImage(inferior, 'JPEG', 0, 277.97, 210, 19.03); // (x, y, width, height)

    const Encabezado = '/images/Encabezado.jpg';
    doc.addImage(Encabezado, 'JPEG', 18.1, 13.9, 159.64, 24.13); // (x, y, width, height)

    console.log('Generando  PDF', data.codCotizacion);
    console.log('Datos de la cotización:', data);

    const ultimaVersion = data.historial[data.historial.length - 1];

    const fechaDocumento = this.formatearFecha(ultimaVersion.fechaModificacion);

    doc.setProperties({
      title: `Cotizacion_${data.codCotizacion}.pdf`,
    });

    // Coordenadas y dimensiones
    const x = 34; // Margen izquierdo
    const y = 55; // Posición en Y
    const anchoEtiqueta = 20;
    const anchoCampo = 109.9;
    const altoFila = 5;
    const radioEsquinas = 1;
    const colorEtiquetaR = 48;
    const colorEtiquetaG = 95;
    const colorEtiquetaB = 114;
    const colorTextoR = 100;
    const colorTextoG = 100;
    const colorTextoB = 100;

    //DATOS EMPRESA

    // rgb(234, 239, 245)
    doc.setDrawColor(234, 239, 245);
    doc.setFillColor(234, 239, 245);
    doc.rect(
      x - anchoEtiqueta,
      y - 1,
      anchoEtiqueta + anchoCampo - 5,
      altoFila * 4 + 2,
      'F',
    );

    let distrito = ultimaVersion.empresaId.distrito;
    let provincia = ultimaVersion.empresaId.provincia;
    let departamento = ultimaVersion.empresaId.departamento;

    if (distrito && provincia && departamento) {
      try {
        const [distritoData, provinciaData, departamentoData] =
          await Promise.all([
            Promise.resolve(
              this._ubigeoService.getDistritoById?.(
                departamento,
                provincia,
                distrito,
              ),
            ),
            Promise.resolve(
              this._ubigeoService.getProvinciaById?.(departamento, provincia),
            ),
            Promise.resolve(
              this._ubigeoService.getDepartamentoById?.(departamento),
            ),
          ]);
        distrito = distritoData?.nombre || distrito;
        provincia = provinciaData?.nombre || provincia;
        departamento = departamentoData?.nombre || departamento;
      } catch (e) {
        // Si falla, deja los códigos originales
      }
    }

    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', x - anchoEtiqueta + 2, y - 5);

    //texto primera fila
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('RAZÓN SOCIAL', x - anchoEtiqueta + 2, y + 3.5);
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'normal');
    doc.text(`${ultimaVersion.razonSocial}` || 'No registrado', x + 3, y + 3.5);

    //texto segundo fila
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'bold');
    doc.text('RUC', x - anchoEtiqueta + 2, y + 3.5 + altoFila);
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'normal');

    doc.text(`${ultimaVersion.ruc}`, x + 3, y + 3.5 + altoFila);

    //texto tercer fila
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'bold');
    doc.text('Dirección', x - anchoEtiqueta + 2, y + 3.5 + altoFila * 2);
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'normal');

    doc.text(
      `${ultimaVersion.empresaId.direccionFiscal} ${distrito ? '- ' + distrito : ''} ${provincia ? '- ' + provincia : ''} ${departamento ? '- ' + departamento : ''}`,
      x + 3,
      y + 3.5 + altoFila * 2,
    );

    //texto tercer fila
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'bold');
    doc.text('Atención a', x - anchoEtiqueta + 2, y + 3.5 + altoFila * 3);
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${ultimaVersion.dirigidoA.nombre || '-'}`,
      x + 3,
      y + 3.5 + altoFila * 3,
    );

    // ------------ DATOS DE DOCUMENTO -----------

    // Coordenadas y dimensionesradioEsquinas
    const espacio1 = 2;
    const anchoEtiquetaCot = 20;
    const xCot = x + anchoCampo - 5 + anchoEtiquetaCot + espacio1; // Margen izquierdo
    const yCot = y; // Posición en Y
    const anchoCampoCot = 40;
    const altoFilaCot = 5.33;
    const radioEsquinasCot = 0.4;
    const cantFilasIntermedias = 4;

    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DE COTIZACIÓN', 170, y - 5, { align: 'center' });

    // Fondo del cuadro de datos de cotización
    doc.setDrawColor(234, 239, 245);
    doc.setFillColor(234, 239, 245);
    doc.rect(
      xCot - anchoEtiquetaCot,
      yCot - 1,
      anchoEtiquetaCot + anchoCampoCot - 5,
      altoFilaCot * 5 + 2,
      'F',
    );

    doc.setDrawColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFillColor(colorTextoR, colorTextoG, colorTextoB);
    doc.roundedRect(
      xCot - anchoEtiquetaCot,
      yCot - 1.5,
      1,
      altoFilaCot * 5 + 2.5,
      radioEsquinasCot,
      radioEsquinasCot,
      'F',
    );

    //texto primera fila

    doc.setFontSize(7);
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'bold');
    doc.text('Código', xCot - anchoEtiquetaCot + 2, yCot + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${data.codCotizacion}`,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5,
      { align: 'center' },
    );

    //texto segunda fila
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha', xCot - anchoEtiquetaCot + 2, yCot + 3.5 + altoFilaCot);
    doc.setFont('helvetica', 'normal');
    doc.text(
      fechaDocumento,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot,
      { align: 'center' },
    );

    //texto tercera fila
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'Versión',
      xCot - anchoEtiquetaCot + 2,
      yCot + 3.5 + altoFilaCot * 2,
    );
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${ultimaVersion.version}`,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot * 2,
      { align: 'center' },
    );

    //texto cuarta fila
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'Forma de pago',
      xCot - anchoEtiquetaCot + 2,
      yCot + 3.5 + altoFilaCot * 3,
    );
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${ultimaVersion.formaPago} ${ultimaVersion.diasCredito ? `(${ultimaVersion.diasCredito} días)` : ''}`,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot * 3,
      { align: 'center' },
    );

    //texto quinta fila
    doc.setTextColor(colorTextoR, colorTextoG, colorTextoB);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'Validez',
      xCot - anchoEtiquetaCot + 2,
      yCot + 3.5 + altoFilaCot * 4,
    );
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${ultimaVersion.validez} días`,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot * 4,
      { align: 'center' },
    );

    // 📌 Tabla de Servicios Cotizados - Manejo dinámico según "Aplicar Valor Total"
    let serviciosParaTabla: any[] = [];

    if (ultimaVersion.aplicarPrecioGlobal) {
      // 🎯 MODO PAQUETE: Cuando está activado "Aplicar Valor Total"
      serviciosParaTabla = this.generarTablaPaquete(
        ultimaVersion.serviciosCotizacion,
        ultimaVersion,
      );
    } else {
      // 🎯 MODO INDIVIDUAL: Servicios normales uno por uno
      serviciosParaTabla = this.generarTablaIndividual(
        ultimaVersion.serviciosCotizacion,
      );
    }

    autoTable(doc, {
      startY: 90,
      head: [['N°', 'Exámenes', 'Precio unitario', 'Cantidad', 'Precio Total']],
      body: serviciosParaTabla,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0] },
      headStyles: {
        fillColor: [colorTextoR, colorTextoG, colorTextoB],
        textColor: [255, 255, 255], // Texto blanco
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15, fillColor: false },
        1: { halign: 'left', cellWidth: 99, fillColor: false },
        2: { halign: 'right', cellWidth: 25, fillColor: false },
        3: { halign: 'center', cellWidth: 17, fillColor: false },
        4: { halign: 'right', cellWidth: 25, fillColor: false },
      },
      // 🎨 Personalizar estilos dinámicamente
      didParseCell: (data) => {
        // Estilo para sub-items de paquetes (filas que empiezan con "  - ")
        if (data.cell.text[0]?.startsWith('  - ')) {
          //data.cell.styles.fillColor = [248, 249, 250]; // Gris muy claro
          data.cell.styles.fontStyle = 'italic';
          data.cell.styles.textColor = [100, 100, 100]; // Gris
        }
        // Estilo para servicios "in house"
        if (data.cell.text[0]?.toLowerCase().includes('Servicio in house')) {
          data.cell.styles.fillColor = [173, 216, 230]; // Azul claro
          data.cell.styles.fontStyle = 'bold';
        }
        // Estilo para sub-totales
        if (data.cell.text[0]?.includes('Sub Total')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [255, 248, 220]; // Color crema
        }
      },
    });

    // 📌 Resumen de costos
    const espaciadoResumenCostos = 5;
    const finalY = (doc as any).lastAutoTable.finalY + espaciadoResumenCostos;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    if (ultimaVersion.descuentoTotal < 0) {
      doc.text(`Monto total:`, 165, finalY, { align: 'right' });
      doc.text(
        `S/ ${ultimaVersion.sumaTotalesPrecioLista.toFixed(2)}`,
        195,
        finalY,
        { align: 'right' },
      );

      doc.text(`Descuento Total:`, 165, finalY + espaciadoResumenCostos, {
        align: 'right',
      });
      doc.text(
        `S/ ${ultimaVersion.descuentoTotal.toFixed(2)}`,
        195,
        finalY + espaciadoResumenCostos,
        { align: 'right' },
      );

      doc.text(`Subtotal:`, 165, finalY + espaciadoResumenCostos * 2, {
        align: 'right',
      });
      doc.text(
        `S/ ${ultimaVersion.subTotal.toFixed(2)}`,
        195,
        finalY + espaciadoResumenCostos * 2,
        {
          align: 'right',
        },
      );

      doc.text(`IGV (18%):`, 165, finalY + espaciadoResumenCostos * 3, {
        align: 'right',
      });
      doc.text(
        `S/ ${ultimaVersion.igv.toFixed(2)}`,
        195,
        finalY + espaciadoResumenCostos * 3,
        { align: 'right' },
      );

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total a Pagar:`, 165, finalY + espaciadoResumenCostos * 4 + 2, {
        align: 'right',
      });
      doc.text(
        `S/ ${ultimaVersion.total.toFixed(2)}`,
        195,
        finalY + espaciadoResumenCostos * 4 + 2,
        { align: 'right' },
      );
    } else {
      doc.text(`Subtotal:`, 165, finalY, {
        align: 'right',
      });
      doc.text(`S/ ${ultimaVersion.subTotal.toFixed(2)}`, 195, finalY, {
        align: 'right',
      });

      doc.text(`IGV (18%):`, 165, finalY + espaciadoResumenCostos, {
        align: 'right',
      });
      doc.text(
        `S/ ${ultimaVersion.igv.toFixed(2)}`,
        195,
        finalY + espaciadoResumenCostos,
        { align: 'right' },
      );

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total a Pagar:`, 165, finalY + espaciadoResumenCostos * 2 + 2, {
        align: 'right',
      });
      doc.text(
        `S/ ${ultimaVersion.total.toFixed(2)}`,
        195,
        finalY + espaciadoResumenCostos * 2 + 2,
        { align: 'right' },
      );
    }

    // 📌 Números de cuenta
    const puntoRefMediosPago = finalY + 40;
    const espaciadoCuentas = 15;
    const espaciado = 6;
    const espaciadoQR = 13;
    const alturaLineaCuentas = 4;
    const inicioX = 15;
    doc.setFontSize(8);
    doc.setTextColor(139, 139, 139); // Gris oscuro
    doc.text(
      'Números de cuenta para depositos',
      inicioX + 75,
      puntoRefMediosPago + espaciadoCuentas,
    );
    doc.text(
      'BBVA Continental: ',
      inicioX + 75,
      puntoRefMediosPago + espaciado + espaciadoCuentas,
    );
    doc.text(
      'Cuenta',
      inicioX + 75,
      puntoRefMediosPago + espaciado + alturaLineaCuentas + espaciadoCuentas,
    );
    doc.text(
      '0011-0252-0100004659',
      inicioX + 12 + 75,
      puntoRefMediosPago + espaciado + alturaLineaCuentas + espaciadoCuentas,
    );
    doc.text(
      'CCI',
      inicioX + 75,
      puntoRefMediosPago +
        espaciado +
        alturaLineaCuentas * 2 +
        espaciadoCuentas,
    );
    doc.text(
      '011-252-000100004659-47',
      inicioX + 12 + 75,
      puntoRefMediosPago +
        espaciado +
        alturaLineaCuentas * 2 +
        espaciadoCuentas,
    );

    doc.text(
      'Banco de crédito (BCP): ',
      inicioX + 60 + 75,
      puntoRefMediosPago + espaciado + espaciadoCuentas,
    );
    doc.text(
      'Cuenta',
      inicioX + 60 + 75,
      puntoRefMediosPago + espaciado + alturaLineaCuentas + espaciadoCuentas,
    );
    doc.text(
      '1912408682020',
      inicioX + 60 + 12 + 75,
      puntoRefMediosPago + espaciado + alturaLineaCuentas + espaciadoCuentas,
    );
    doc.text(
      'CCI',
      inicioX + 60 + 75,
      puntoRefMediosPago +
        espaciado +
        alturaLineaCuentas * 2 +
        espaciadoCuentas,
    );
    doc.text(
      '00219100240868202056',
      inicioX + 60 + 12 + 75,
      puntoRefMediosPago +
        espaciado +
        alturaLineaCuentas * 2 +
        espaciadoCuentas,
    );

    doc.text(
      'Medios de pago a nombre de LAB FRAY SAC:',
      15,
      puntoRefMediosPago - 6,
    );

    const logoyapeBase64 = '/images/LogoYape.jpg';
    doc.addImage(
      logoyapeBase64,
      'JPEG',
      inicioX + 6,
      puntoRefMediosPago,
      12.5,
      12.05,
    ); // (x, y, width, height)

    const QRyapeBase64 = '/images/QR Yape.jpg';
    doc.addImage(
      QRyapeBase64,
      'JPEG',
      inicioX,
      puntoRefMediosPago + espaciadoQR,
      25,
      25,
    ); // (x, y, width, height)

    const logoplinBase64 = '/images/LogoPlin.jpg';
    doc.addImage(
      logoplinBase64,
      'JPEG',
      inicioX + 40 + 6,
      puntoRefMediosPago,
      12.5,
      12,
    ); // (x, y, width, height)

    const QRplinBase64 = '/images/QR Plin.jpg';
    doc.addImage(
      QRplinBase64,
      'JPEG',
      inicioX + 40,
      puntoRefMediosPago + espaciadoQR,
      25,
      25,
    ); // (x, y, width, height)

    doc.text('Consideraciones:', inicioX, puntoRefMediosPago + 45);
    doc.text(
      '- La evaluación se programa de acuerdo a disponibilidad, por favor coordinar con al menos 1 semana de anticipación.',
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas,
    );
    doc.text(
      '- Compartir el pago realizado con su asesor de ventas',
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas * 2,
    );
    doc.text(
      '- Para el examen de BK y Parasitológico en heces, el paciente deberá recoger la muestra en su domicilio.',
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas * 3,
    );
    doc.text(
      `- Los resultados están disponibles en ${ultimaVersion.entregaResultados} días hábiles.`,
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas * 4,
    );
    doc.text(
      `- Los resultados se emiten en formato digital.`,
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas * 5,
    );

    doc.text(
      `Atentamente`,
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas * 8,
    );

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    if (preview) {
      return this._sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
    } else {
      doc.save(`Cotizacion_${data.codCotizacion}.pdf`);
    }
  }

  formatearFecha(fecha: Date | null) {
    if (!fecha) return '';

    const nuevafecha = new Date(fecha);

    // Obtener fecha y hora local
    const dia = nuevafecha.getDate().toString().padStart(2, '0');
    const mes = (nuevafecha.getMonth() + 1).toString().padStart(2, '0'); // Enero es 0
    const anio = nuevafecha.getFullYear();

    const horas = nuevafecha.getHours().toString().padStart(2, '0');
    const minutos = nuevafecha.getMinutes().toString().padStart(2, '0');

    return `${dia}/${mes}/${anio} - ${horas}:${minutos}`;
  }

  /**
   * 🎯 Genera tabla en modo PAQUETE cuando está activado "Aplicar Valor Total"
   * Agrupa todos los servicios excepto "in house" bajo un paquete
   */
  private generarTablaPaquete(servicios: any[], historial: any): any[] {
    const tablaPaquete: any[] = [];

    // Separar servicios normales de "in house"
    const serviciosNormales = servicios.filter(
      (s) => !this.esServicioInHouse(s),
    );
    const serviciosInHouse = servicios.filter((s) => this.esServicioInHouse(s));

    if (serviciosNormales.length > 0) {
      // 📦 Fila principal del paquete - usar precioConDescGlobal y cantidadGlobal
      const precioPaquete = historial.precioConDescGlobal || 0;
      const cantidadPaquete = historial.cantidadGlobal || 1;
      const totalPaquete = precioPaquete * cantidadPaquete;

      tablaPaquete.push([
        '1',
        `Paquete exámenes ETA's`,
        `S/ ${precioPaquete.toFixed(2)}`,
        cantidadPaquete,
        `S/ ${totalPaquete.toFixed(2)}`,
      ]);

      // 📋 Sub-items del paquete (detalles de cada examen)
      serviciosNormales.forEach((servicio: any) => {
        tablaPaquete.push(['', `  - ${servicio.nombreServicio}`, '', '', '']);
      });
    }

    // ➕ Agregar servicios "in house" por separado
    let contadorInHouse = 2;
    serviciosInHouse.forEach((servicio: any) => {
      tablaPaquete.push([
        contadorInHouse.toString(),
        servicio.nombreServicio,
        `S/ ${servicio.precioVenta.toFixed(2)}`,
        servicio.cantidad,
        `S/ ${servicio.totalUnitario.toFixed(2)}`,
      ]);
      contadorInHouse++;
    });

    // 📊 Sub Total del paquete (si hay múltiples servicios normales)
    if (serviciosNormales.length > 1) {
      const precioPaquete = historial.precioConDescGlobal || 0;
      const cantidadPaquete = historial.cantidadGlobal || 1;
      const totalPaquete = precioPaquete * cantidadPaquete;

      tablaPaquete.push([
        '',
        'Sub Total',
        '',
        '',
        `S/ ${totalPaquete.toFixed(2)}`,
      ]);
    }

    return tablaPaquete;
  }

  /**
   * 🎯 Genera tabla en modo INDIVIDUAL (modo normal)
   * Cada servicio se muestra por separado
   */
  private generarTablaIndividual(servicios: any[]): any[] {
    return servicios.map((servicio: any, index: number) => [
      `${index + 1}`,
      servicio.nombreServicio,
      `S/ ${servicio.precioVenta.toFixed(2)}`,
      servicio.cantidad,
      `S/ ${servicio.totalUnitario.toFixed(2)}`,
    ]);
  }

  /**
   * 🏠 Determina si un servicio es "in house" basándose en su código
   * Puedes ajustar esta lógica según los códigos específicos que manejes
   */
  private esServicioInHouse(servicio: any): boolean {
    // Lógica para identificar servicios "in house"
    // Puedes basarte en:
    // - Código del servicio
    // - Nombre del servicio
    // - Tipo de servicio

    const codigosInHouse = ['PRO0001']; // Ajusta según tus códigos
    const nombresInHouse = ['SERVICIO IN HOUSE'];

    const codigoMatch = codigosInHouse.some((codigo) =>
      servicio.codServicio?.toUpperCase().includes(codigo),
    );

    const nombreMatch = nombresInHouse.some((nombre) =>
      servicio.nombreServicio?.toUpperCase().includes(nombre),
    );

    return codigoMatch || nombreMatch;
  }
}
