import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ArchivoPacienteService, IFotoTemporalHistorial } from '../../../../../../services/mantenimiento/paciente/archivo-paciente.service';

export interface DatosHistorialFotografiaTemporal {
  programacionEmpresaId: string;
  codigoProgramacion: string;
}

@Component({
  selector: 'app-dialog-historial-fotos-temporales',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './dialog-historial-fotos-temporales.component.html',
  styles: [`
    .cabecera-historial { display:flex; align-items:center; gap:10px; color:#143b70; }
    .cabecera-historial mat-icon { color:#0063bc; }
    .subtitulo { color:#657b98; font-size:12px; margin:0 0 14px; }
    .contenido-historial { display:grid; grid-template-columns:minmax(250px, 1fr) minmax(270px, 1fr); gap:16px; }
    .panel-historial { background:#f7f9fd; border:1px solid #d5e3f3; border-radius:10px; padding:12px; min-width:0; }
    .elemento-historial { width:100%; text-align:left; display:block; border:1px solid #d9e3f0; background:white;
      margin:8px 0; border-radius:8px; padding:9px; cursor:pointer; font:inherit; font-size:12px; color:#17406b; }
    .elemento-historial.seleccionado { border:2px solid #0066bb; background:#edf5ff; }
    .elemento-historial strong { display:block; margin-bottom:4px; }
    .elemento-historial span { display:block; color:#5e7188; margin-top:3px; }
    .foto-vista { min-height:215px; display:flex; align-items:center; justify-content:center; background:#edf3fb;
      border:1px dashed #bdcee7; border-radius:8px; overflow:hidden; }
    .foto-vista img, .foto-vista video { max-width:100%; width:100%; max-height:290px; object-fit:contain; }
    .foto-vista video { transform:scaleX(-1); }
    .acciones-foto { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
    .aviso { font-size:12px; line-height:1.4; color:#8e530d; background:#fff7e8; border-radius:6px; padding:9px; }
    .error { color:#b42318; font-size:12px; }
    @media(max-width:700px) { .contenido-historial { grid-template-columns:1fr; } }
  `],
})
export class DialogHistorialFotosTemporalesComponent implements OnInit, OnDestroy {
  @ViewChild('videoCamara') videoCamara?: ElementRef<HTMLVideoElement>;
  private readonly archivos = inject(ArchivoPacienteService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(MatDialogRef<DialogHistorialFotosTemporalesComponent>);

  historial: IFotoTemporalHistorial[] = [];
  seleccionadaId: string | null = null;
  urlHistorica: string | null = null;
  urlNueva: string | null = null;
  fotoNueva: Blob | null = null;
  camaraActiva = false;
  consultando = true;
  guardando = false;
  mensajeError = '';
  huboCambios = false;
  private stream: MediaStream | null = null;
  private destruido = false;

  readonly data = inject<DatosHistorialFotografiaTemporal>(MAT_DIALOG_DATA);

  ngOnInit(): void { void this.cargarHistorial(); }

  async cargarHistorial(): Promise<void> {
    this.consultando = true;
    this.mensajeError = '';
    try {
      const respuesta = await firstValueFrom(this.archivos.obtenerHistorialFotosTemporales(this.data.programacionEmpresaId));
      this.historial = respuesta.fotos || [];
      if (this.historial.length) await this.verFoto(this.historial.find(f => f.estadoArchivo === 'ACTIVO') || this.historial[0]);
    } catch (error: any) {
      this.mensajeError = error?.error?.msg || 'No se pudo consultar el historial fotográfico.';
    } finally { this.consultando = false; }
  }

  async verFoto(foto: IFotoTemporalHistorial): Promise<void> {
    this.mensajeError = '';
    this.seleccionadaId = foto._id;
    this.liberarVistaHistorica();
    try {
      // ====== Compartir caché de la foto activa con las miniaturas ======
      let blob: Blob | null;
      if (foto.estadoArchivo === 'ACTIVO') {
        const resultado = await firstValueFrom(this.archivos.obtenerFotoEvaluacionCacheada({
          programacionEmpresaId: this.data.programacionEmpresaId,
        }));
        blob = resultado.imagen;
      } else {
        blob = await firstValueFrom(this.archivos.obtenerImagenHistoricaTemporalCacheada(
          this.data.programacionEmpresaId, foto._id,
        ));
      }
      if (this.destruido || this.seleccionadaId !== foto._id) return;
      if (!blob?.size || !blob.type.startsWith('image/')) throw new Error('Imagen no válida');
      this.urlHistorica = URL.createObjectURL(blob);
    } catch (error: any) {
      if (!this.destruido && this.seleccionadaId === foto._id) this.mensajeError = error?.error?.msg || 'No se pudo mostrar esta fotografía.';
    }
  }

  async activarCamara(): Promise<void> {
    this.mensajeError = '';
    this.liberarNueva();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Cámara no disponible en este navegador');
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      this.camaraActiva = true;
      this.cdr.detectChanges();
      const video = this.videoCamara?.nativeElement;
      if (!video) throw new Error('No se pudo iniciar la previsualización');
      video.srcObject = this.stream;
      await video.play();
    } catch (error: any) {
      this.detenerCamara();
      this.mensajeError = error?.message || 'No se pudo acceder a la cámara.';
    }
  }

  async capturarFoto(): Promise<void> {
    const video = this.videoCamara?.nativeElement;
    if (!video?.videoWidth || !video.videoHeight || this.guardando) return;
    const escala = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * escala));
    canvas.height = Math.max(1, Math.round(video.videoHeight * escala));
    const ctx = canvas.getContext('2d');
    if (!ctx) { this.mensajeError = 'No se pudo preparar la fotografía.'; return; }
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    for (const calidad of [0.86, 0.76, 0.66, 0.56]) {
      const foto = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', calidad));
      if (!foto) continue;
      if (foto.size <= 1_800_000) {
        this.fotoNueva = foto;
        this.urlNueva = URL.createObjectURL(foto);
        this.detenerCamara();
        return;
      }
    }
    this.mensajeError = 'Fotografía demasiado grande. Intenta capturar otra (máximo 1.8 MB).';
  }

  async repetirFoto(): Promise<void> { await this.activarCamara(); }

  async guardarFoto(): Promise<void> {
    if (!this.fotoNueva || this.guardando) return;
    const tieneAnterior = this.historial.some(f => f.estadoArchivo === 'ACTIVO');
    const confirmado = await Swal.fire({
      icon: 'question', title: tieneAnterior ? '¿Reemplazar fotografía activa?' : '¿Guardar fotografía?',
      text: tieneAnterior ? 'La fotografía actual seguirá disponible en el historial, con fecha y responsable del reemplazo.' : 'La fotografía quedará vinculada a esta programación sin crear paciente ni HC.',
      showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar',
    });
    if (!confirmado.isConfirmed) return;
    this.guardando = true;
    try {
      await firstValueFrom(this.archivos.subirFotoEvaluacionTemporal(this.data.programacionEmpresaId, this.fotoNueva));
      this.huboCambios = true;
      this.liberarNueva();
      await this.cargarHistorial();
      await Swal.fire({ icon: 'success', title: 'Fotografía registrada', text: 'El historial conserva las versiones anteriores.' });
    } catch (error: any) {
      this.mensajeError = error?.error?.msg || 'No se pudo guardar la fotografía. Puedes reintentar sin iniciar otra atención.';
    } finally { this.guardando = false; }
  }

  cerrar(): void { this.dialogRef.close({ actualizado: this.huboCambios }); }
  private detenerCamara(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.camaraActiva = false;
  }
  private liberarNueva(): void {
    if (this.urlNueva) URL.revokeObjectURL(this.urlNueva);
    this.urlNueva = null;
    this.fotoNueva = null;
  }
  private liberarVistaHistorica(): void {
    if (this.urlHistorica) URL.revokeObjectURL(this.urlHistorica);
    this.urlHistorica = null;
  }
  ngOnDestroy(): void {
    this.destruido = true;
    this.detenerCamara();
    this.liberarNueva();
    this.liberarVistaHistorica();
  }
}
