import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ISolicitudAtencion } from '../../../../models/solicitudAtencion.models';

@Injectable({
  providedIn: 'root'
})
export class HcPdfService {

  constructor(
    private _sanitizer: DomSanitizer,
  ) { }

  generarHistoriaClinicaPDF(data: ISolicitudAtencion): SafeResourceUrl | void {
  const doc = new jsPDF();

  const fecha = new Date(data.fechaEmision).toLocaleDateString();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  // Encabezado
  doc.setFillColor(0, 70, 135); // azul oscuro
  doc.rect(10, 10, 190, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('LAB FRAY', 12, 17);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text('EVOLUCIÓN AMBULATORIA', 80, 17);

  doc.setFontSize(9);
  doc.text(`HC: ${data.hc}`, 170, 14);
  doc.text(`DNI: ${data.nroDocumento}`, 170, 18);

  // Paciente y doctor
  doc.setFont('helvetica', 'bold');
  doc.text(`Nombres y Apellidos:`, 12, 30);
  doc.setFont('helvetica', 'normal');
  doc.text(data.pacienteNombre, 50, 30);

  doc.setFont('helvetica', 'bold');
  doc.text(`Doctor(a):`, 140, 30);
  doc.setFont('helvetica', 'normal');
  doc.text('GOMEZ', 160, 30); // Este dato debe venir dinámico más adelante

  // Datos de control
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', 12, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(fecha, 30, 36);

  // ... puedes continuar con los campos de "Motivo de consulta", "FUR", "RAM", "Antecedentes", etc.
  // Aquí podrías dejar espacio para que se llene a mano o más adelante lo completen digitalmente.

  // Firma
  doc.setFont('helvetica', 'bold');
  doc.text('FIRMA Y SELLO', 140, 270);

  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);

  //doc.save(`HC_${data.codigoSolicitud}.pdf`);

  return this._sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
}

}
