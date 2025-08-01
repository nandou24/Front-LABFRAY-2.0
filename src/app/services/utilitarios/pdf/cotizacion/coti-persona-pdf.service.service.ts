import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IPaciente } from '../../../../models/Mantenimiento/paciente.models';
import { firstValueFrom } from 'rxjs';
import { PacienteService } from '../../../mantenimiento/paciente/paciente.service';

@Injectable({
  providedIn: 'root',
})
export class CotiPersonaPdfServiceService {
  constructor(
    private _sanitizer: DomSanitizer,
    private readonly _pacienteService: PacienteService,
  ) {}
  /**
   * Genera un PDF de la cotización y lo descarga o lo previsualiza.
   * @param data Datos de la cotización.
   * @param preview Si es true, devuelve una URL segura para previsualizar el PDF; si es false, descarga el PDF.
   * @returns URL segura del PDF para previsualización o void si se descarga.
   */

  datoPaciente = {} as IPaciente;
  async generarPDFCotizacion(
    data: any,
    preview: boolean,
  ): Promise<SafeResourceUrl | void> {
    const doc = new jsPDF();

    // ... AQUÍ PEGA TODO TU CÓDIGO ACTUAL con `data` en vez de `data` ...

    const imagenBase64 = '/images/logo labfray.png';
    doc.addImage(imagenBase64, 'PNG', 15, 10, 22.4, 25); // (x, y, width, height)

    console.log('Generando  PDF', data.codCotizacion);
    console.log('Datos de la cotización:', data);

    const ultimaVersion = data.historial[data.historial.length - 1];

    const fechaDocumento = this.formatearFecha(ultimaVersion.fechaModificacion);

    // try {
    //   // Obtener los datos del paciente
    //   this.datoPaciente = await firstValueFrom(
    //     this._pacienteService.getPatientbyId(ultimaVersion.clienteId),
    //   );
    //   console.log('Datos del paciente obtenidos:', this.datoPaciente);
    // } catch (error) {
    //   console.error('Error al obtener los datos del paciente:', error);
    // }

    doc.setProperties({
      title: `Cotizacion_${data.codCotizacion}.pdf`,
    });

    //Encabezado
    doc.setFontSize(7);
    doc.setTextColor(139, 139, 139);
    doc.setFont('helvetica', 'bold');
    const encX = 40;
    const encY = 15;
    const encAltoFila = 4;
    doc.text('LAB FRAY SAC', encX, encY);
    doc.text('COMAS', encX, encY + encAltoFila);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Policlínico  Av. Túpac Amaru 3809 (01) 525-6675',
      encX + 13,
      encY + encAltoFila,
    );

    doc.setFont('helvetica', 'bold');
    doc.text('CALLAO', encX, encY + encAltoFila * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Laboratorio clínico  Av. Elmer Faucett 326 - Carmen de la Legua (01) 452-6316',
      encX + 13,
      encY + encAltoFila * 2,
    );
    doc.text('Whatsapp: 924870728', encX, encY + encAltoFila * 3);
    doc.text('E-mail: correo@labfray.pe', encX, encY + encAltoFila * 4);
    doc.text('www.labfray.pe', encX, encY + encAltoFila * 5);

    //DATOS PACIENTE

    // Coordenadas y dimensiones
    const x = 34; // Margen izquierdo
    const y = 42; // Posición en Y
    const anchoEtiqueta = 20;
    const anchoCampo = 109.9;
    const altoFila = 5;
    const radioEsquinas = 1;
    const colorEtiquetaR = 48;
    const colorEtiquetaG = 95;
    const colorEtiquetaB = 114;

    //-------FILA SUPERIOR
    // Dibujar campo con bordes redondeados
    doc.setDrawColor(255, 255, 255); // Color del borde negro
    doc.roundedRect(
      x - 5,
      y,
      anchoCampo,
      altoFila,
      radioEsquinas,
      radioEsquinas,
      'D',
    );

    // Dibujar rectángulo con fondo azul para la etiqueta
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.roundedRect(
      x - anchoEtiqueta,
      y,
      anchoEtiqueta,
      altoFila,
      radioEsquinas,
      radioEsquinas,
      'DF',
    );

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(x - anchoEtiqueta + 1, y, anchoEtiqueta, altoFila, 'F');
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.rect(
      x - anchoEtiqueta,
      y + altoFila / 2,
      anchoEtiqueta / 4,
      altoFila / 2,
      'F',
    );

    //-------FILA INFERIOR
    // Dibujar campo con bordes redondeados
    doc.setDrawColor(255, 255, 255); // Color del borde negro
    doc.roundedRect(
      x - 5,
      y + altoFila * 2,
      anchoCampo,
      altoFila,
      radioEsquinas,
      radioEsquinas,
      'D',
    );

    // Dibujar rectángulo con fondo azul para la etiqueta
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.roundedRect(
      x - anchoEtiqueta,
      y + altoFila * 2,
      anchoEtiqueta,
      altoFila,
      radioEsquinas,
      radioEsquinas,
      'DF',
    );

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(
      x - anchoEtiqueta + 1,
      y + altoFila * 2,
      anchoEtiqueta,
      altoFila,
      'F',
    );
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.rect(
      x - anchoEtiqueta,
      y + altoFila * 2,
      anchoEtiqueta / 4,
      altoFila / 2,
      'F',
    );

    //------- FILAS INTERMEDIAS (1 EN ESTE CASO)
    // Dibujar campo con bordes redondeados
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Color del borde negro
    doc.rect(x - 5, y + altoFila, anchoCampo, altoFila, 'D');

    // Dibujar rectángulo con fondo azul para la etiqueta
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(x - anchoEtiqueta, y + altoFila, anchoEtiqueta, altoFila, 'F');

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(x - anchoEtiqueta + 1, y + altoFila, anchoEtiqueta, altoFila, 'F');

    //BORDE TOTAL
    doc.roundedRect(
      x - anchoEtiqueta,
      y,
      anchoEtiqueta + anchoCampo - 5,
      altoFila * 3,
      1,
      1,
    );

    //texto primera fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text('Paciente', x - anchoEtiqueta + 2, y + 3.5);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${ultimaVersion.apePatCliente} ${ultimaVersion.apeMatCliente} ${ultimaVersion.nombreCliente}` ||
        'No registrado',
      x + 3,
      y + 3.5,
    );

    //texto segundo fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text('Documento', x - anchoEtiqueta + 2, y + 3.5 + altoFila);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${ultimaVersion.tipoDoc} ${ultimaVersion.nroDoc || '-'}`,
      x + 3,
      y + 3.5 + altoFila,
    );

    //texto tercer fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text('HC', x - anchoEtiqueta + 2, y + 3.5 + altoFila * 2);
    doc.setTextColor(0, 0, 0);
    doc.text(`${ultimaVersion.hc || '-'}`, x + 3, y + 3.5 + altoFila * 2);

    //DATOS SOLICITANTE

    // Coordenadas y dimensionesradioEsquinas
    const xSol = 34; // Margen izquierdo
    const ySol = y + 3 * altoFila + 2; // Posición en Y
    const anchoEtiquetaSol = 20;
    const anchoCampoSol = 109.9;
    const altoFilaSol = 5;
    const radioEsquinasSol = 1;

    //-------FILA SUPERIOR
    // Dibujar campo con bordes redondeados
    doc.setDrawColor(255, 255, 255); // Color del borde negro
    doc.roundedRect(
      xSol - 5,
      ySol,
      anchoCampoSol,
      altoFilaSol,
      radioEsquinasSol,
      radioEsquinasSol,
      'D',
    );

    // Dibujar rectángulo con fondo azul para la etiqueta
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.roundedRect(
      xSol - anchoEtiquetaSol,
      ySol,
      anchoEtiquetaSol,
      altoFilaSol,
      radioEsquinasSol,
      radioEsquinasSol,
      'DF',
    );

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(
      xSol - anchoEtiquetaSol + 1,
      ySol,
      anchoEtiquetaSol,
      altoFilaSol,
      'F',
    );
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.rect(
      xSol - anchoEtiquetaSol,
      ySol + altoFilaSol / 2,
      anchoEtiquetaSol / 4,
      altoFilaSol / 2,
      'F',
    );

    //-------FILA INFERIOR
    // Dibujar campo con bordes redondeados
    doc.setDrawColor(255, 255, 255); // Color del borde negro
    doc.roundedRect(
      xSol - 5,
      ySol + altoFilaSol * 2,
      anchoCampoSol,
      altoFilaSol,
      radioEsquinasSol,
      radioEsquinasSol,
      'D',
    );

    // Dibujar rectángulo con fondo azul para la etiqueta
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscurox
    doc.roundedRect(
      xSol - anchoEtiquetaSol,
      ySol + altoFilaSol * 2,
      anchoEtiquetaSol,
      altoFilaSol,
      radioEsquinasSol,
      radioEsquinasSol,
      'DF',
    );

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(
      xSol - anchoEtiquetaSol + 1,
      ySol + altoFilaSol * 2,
      anchoEtiquetaSol,
      altoFilaSol,
      'F',
    );
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.rect(
      xSol - anchoEtiquetaSol,
      ySol + altoFilaSol * 2,
      anchoEtiquetaSol / 4,
      altoFilaSol / 2,
      'F',
    );

    //------- FILAS INTERMEDIAS (1 EN ESTE CASO)
    // Dibujar campo con bordes redondeados
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Color del borde negro
    doc.rect(xSol - 5, ySol + altoFilaSol, anchoCampoSol, altoFilaSol, 'D');

    // Dibujar rectángulo con fondo azul para la etiqueta
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(
      xSol - anchoEtiquetaSol,
      ySol + altoFilaSol,
      anchoEtiquetaSol,
      altoFilaSol,
      'F',
    );

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(
      xSol - anchoEtiquetaSol + 1,
      ySol + altoFilaSol,
      anchoEtiquetaSol,
      altoFilaSol,
      'F',
    );

    //BORDE TOTAL
    doc.roundedRect(
      xSol - anchoEtiquetaSol,
      ySol,
      anchoEtiquetaSol + anchoCampoSol - 5,
      altoFilaSol * 3,
      1,
      1,
    );

    //texto primera fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text('Profesional', xSol - anchoEtiquetaSol + 2, ySol + 3.5);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${ultimaVersion.apePatRefMedico} ${ultimaVersion.apeMatRefMedico} ${ultimaVersion.nombreRefMedico}` ||
        'No registrado',
      xSol + 3,
      ySol + 3.5,
    );

    //texto segundo fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Profesión',
      xSol - anchoEtiquetaSol + 2,
      ySol + 3.5 + altoFilaSol,
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${ultimaVersion.profesionSolicitante || '-'}`,
      xSol + 3,
      ySol + 3.5 + altoFilaSol,
    );

    //texto tercer fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Colegiatura',
      xSol - anchoEtiquetaSol + 2,
      ySol + 3.5 + altoFilaSol * 2,
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${ultimaVersion.colegiatura || '-'}`,
      xSol + 3,
      ySol + 3.5 + altoFilaSol * 2,
    );

    // ------------ DATOS DE DOCUMENTO -----------

    // Coordenadas y dimensionesradioEsquinas
    const espacio1 = 2;
    const anchoEtiquetaCot = 20;
    const xCot = x + anchoCampo - 5 + anchoEtiquetaCot + espacio1; // Margen izquierdo
    const yCot = y; // Posición en Y
    const anchoCampoCot = 40;
    const altoFilaCot = 5.33;
    const radioEsquinasCot = 1;
    const cantFilasIntermedias = 4;

    //-------FILA SUPERIOR
    // Dibujar campo con bordes redondeados
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.roundedRect(
      xCot - 5,
      yCot,
      anchoCampoCot,
      altoFilaCot,
      radioEsquinasCot,
      radioEsquinasCot,
      'DF',
    );

    // Dibujar rectángulo con fondo azul para la etiqueta
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.roundedRect(
      xCot - anchoEtiquetaCot,
      yCot,
      anchoEtiquetaCot,
      altoFilaCot,
      radioEsquinasCot,
      radioEsquinasCot,
      'DF',
    );

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(
      xCot - anchoEtiquetaCot + 1,
      yCot,
      anchoEtiquetaCot,
      altoFilaCot,
      'F',
    );
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.rect(
      xCot - anchoEtiquetaCot,
      yCot + altoFilaCot / 2,
      anchoEtiquetaCot / 4,
      altoFilaCot / 2,
      'F',
    );

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.rect(
      xCot + anchoCampoCot - 5 - anchoEtiquetaCot / 4,
      yCot + altoFilaCot / 2,
      anchoEtiquetaCot / 4,
      altoFilaCot / 2,
      'F',
    );

    //-------FILA INFERIOR
    // Dibujar campo con bordes redondeados
    doc.setDrawColor(255, 255, 255); // Color del borde negro
    doc.roundedRect(
      xCot - 5,
      yCot + altoFilaCot * (1 + cantFilasIntermedias),
      anchoCampoCot,
      altoFilaCot,
      radioEsquinasCot,
      radioEsquinasCot,
      'D',
    );

    // Dibujar rectángulo con fondo azul para la etiqueta
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.roundedRect(
      xCot - anchoEtiquetaCot,
      yCot + altoFilaCot * (1 + cantFilasIntermedias),
      anchoEtiquetaCot,
      altoFilaCot,
      radioEsquinasCot,
      radioEsquinasCot,
      'DF',
    );

    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
    doc.rect(
      xCot - anchoEtiquetaCot + 1,
      yCot + altoFilaCot * (1 + cantFilasIntermedias),
      anchoEtiquetaCot,
      altoFilaCot,
      'F',
    );
    doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.rect(
      xCot - anchoEtiquetaCot,
      yCot + altoFilaCot * (1 + cantFilasIntermedias),
      anchoEtiquetaCot / 4,
      altoFilaCot / 2,
      'F',
    );

    //------- FILAS INTERMEDIAS (1 EN ESTE CASO)
    for (let i = 1; i <= cantFilasIntermedias; i++) {
      // Dibujar campo con bordes redondeados
      doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Color del borde negro
      doc.rect(
        xCot - 5,
        yCot + altoFilaCot * i,
        anchoCampoCot,
        altoFilaCot,
        'D',
      );

      // Dibujar rectángulo con fondo azul para la etiqueta
      doc.setDrawColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
      doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
      doc.rect(
        xCot - anchoEtiquetaCot,
        yCot + altoFilaCot * i,
        anchoEtiquetaCot,
        altoFilaCot,
        'F',
      );

      doc.setFillColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB); // Azul oscuro
      doc.rect(
        xCot - anchoEtiquetaCot + 1,
        yCot + altoFilaCot * i,
        anchoEtiquetaCot,
        altoFilaCot,
        'F',
      );
    }

    //BORDE TOTAL
    doc.roundedRect(
      xCot - anchoEtiquetaCot,
      yCot,
      anchoEtiquetaCot + anchoCampoCot - 5,
      altoFilaCot * (cantFilasIntermedias + 2),
      1,
      1,
    );

    //texto primera fila
    //doc.setFontSize(8);
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'bold');
    doc.text('Datos de documento', 170, yCot + 3.5, { align: 'center' });

    //texto segundo fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text('Código', xCot - anchoEtiquetaCot + 2, yCot + 3.5 + altoFilaCot);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${data.codCotizacion}`,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot,
      { align: 'center' },
    );

    //texto tercer fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Fecha',
      xCot - anchoEtiquetaCot + 2,
      yCot + 3.5 + altoFilaCot * 2,
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      fechaDocumento,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot * 2,
      { align: 'center' },
    );

    //texto cuarta fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Versión',
      xCot - anchoEtiquetaCot + 2,
      yCot + 3.5 + altoFilaCot * 3,
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${ultimaVersion.version}`,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot * 3,
      { align: 'center' },
    );

    //texto quinta fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Forma de pago',
      xCot - anchoEtiquetaCot + 2,
      yCot + 3.5 + altoFilaCot * 4,
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Contado`,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot * 4,
      { align: 'center' },
    );

    //texto sexta fila
    doc.setTextColor(255, 255, 255); // Texto blanco
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Validez',
      xCot - anchoEtiquetaCot + 2,
      yCot + 3.5 + altoFilaCot * 5,
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      `5 días`,
      xCot + (xCot + anchoCampoCot - 5 - xCot) / 2,
      yCot + 3.5 + altoFilaCot * 5,
      { align: 'center' },
    );

    doc.setFontSize(20);
    doc.setTextColor(colorEtiquetaR, colorEtiquetaG, colorEtiquetaB);
    doc.setFont('helvetica', 'bold');
    doc.text('COTIZACIÓN', 195, 37, { align: 'right' });

    // 📌 Tabla de Servicios Cotizados
    const servicios = ultimaVersion.serviciosCotizacion.map((servicio: any) => [
      servicio.codServicio,
      servicio.nombreServicio,
      servicio.cantidad,
      `S/ ${servicio.precioLista.toFixed(2)}`,
      `S/ ${servicio.diferencia.toFixed(2)}`,
      `S/ ${servicio.totalUnitario.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 78,
      head: [['Código', 'Nombre', 'Cantidad', 'Precio', 'Descuento', 'Total']],
      body: servicios,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 0.1, textColor: [0, 0, 0] },
      headStyles: {
        fillColor: [39, 96, 114], // Azul oscuro (RGB)
        textColor: [255, 255, 255], // Texto blanco
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
    });

    // 📌 Resumen de costos
    const espaciadoResumenCostos = 5;
    const finalY = (doc as any).lastAutoTable.finalY + espaciadoResumenCostos;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total:`, 165, finalY, { align: 'right' });
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
      { align: 'right' },
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

    const logoyapeBase64 = '/images/LogoYape.png';
    doc.addImage(
      logoyapeBase64,
      'PNG',
      inicioX + 6,
      puntoRefMediosPago,
      12.5,
      12.05,
    ); // (x, y, width, height)

    const QRyapeBase64 = '/images/QR Yape.png';
    doc.addImage(
      QRyapeBase64,
      'PNG',
      inicioX,
      puntoRefMediosPago + espaciadoQR,
      25,
      25,
    ); // (x, y, width, height)

    const logoplinBase64 = '/images/LogoPlin.png';
    doc.addImage(
      logoplinBase64,
      'PNG',
      inicioX + 40 + 6,
      puntoRefMediosPago,
      12.5,
      12,
    ); // (x, y, width, height)

    const QRplinBase64 = '/images/QR Plin.png';
    doc.addImage(
      QRplinBase64,
      'PNG',
      inicioX + 40,
      puntoRefMediosPago + espaciadoQR,
      25,
      25,
    ); // (x, y, width, height)

    doc.text('Consideraciones:', inicioX, puntoRefMediosPago + 45);
    doc.text(
      '- Las tranferencias interbancarias deben ser inmediatas',
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas,
    );
    doc.text(
      '- Compartir el pago realizado a través de yape o plin al 924870728, indicando el nombre del paciente',
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas * 2,
    );
    doc.text(
      '- Los pagos con tarjeta tienen un recargo del 5%, por favor priorice otro medio de pago',
      inicioX,
      puntoRefMediosPago + 45 + alturaLineaCuentas * 3,
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
}
