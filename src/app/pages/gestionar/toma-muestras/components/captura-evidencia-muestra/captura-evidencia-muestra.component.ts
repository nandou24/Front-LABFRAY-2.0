import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type OrigenEvidenciaCapturada = 'CAMARA' | 'ARCHIVO';

export interface IEvidenciaCapturada {
  archivo: File;
  origen: OrigenEvidenciaCapturada;
}

@Component({
  selector: 'app-captura-evidencia-muestra',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './captura-evidencia-muestra.component.html',
  styleUrl: './captura-evidencia-muestra.component.scss',
})
export class CapturaEvidenciaMuestraComponent implements OnDestroy {
  @Input() titulo = 'Evidencia fotográfica';

  @Input() descripcion =
    'Tome una fotografía o cargue una imagen desde el dispositivo.';

  @Input() requerido = false;

  @Input() disabled = false;

  @Input() tamanoMaximoBytes = 1_800_000;

  @Output() evidenciaChange =
    new EventEmitter<IEvidenciaCapturada | null>();

  @ViewChild('videoCamara')
  videoCamara?: ElementRef<HTMLVideoElement>;

  @ViewChild('inputArchivo')
  inputArchivo?: ElementRef<HTMLInputElement>;

  archivoSeleccionado: File | null = null;
  origenSeleccionado: OrigenEvidenciaCapturada | null = null;
  previewUrl: string | null = null;

  camaraActiva = false;
  capturando = false;
  procesandoArchivo = false;
  errorCamara = '';
  errorArchivo = '';

  private streamCamara: MediaStream | null = null;

  // ====== Ciclo de vida ======

  ngOnDestroy(): void {
    this.detenerCamara();
    this.liberarPreview();
  }

  // ====== Abrir cámara ======

  async abrirCamara(): Promise<void> {
    if (this.disabled || this.camaraActiva) {
      return;
    }

    this.errorCamara = '';
    this.errorArchivo = '';

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      this.errorCamara =
        'La cámara no está disponible en este navegador. Puede cargar una imagen desde el dispositivo.';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: 'environment',
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      this.detenerCamara();
      this.limpiarEvidenciaInterna(true);

      this.streamCamara = stream;
      this.camaraActiva = true;

      const video = this.videoCamara?.nativeElement;

      if (!video) {
        throw new Error('No se pudo preparar la vista previa de la cámara');
      }

      video.srcObject = stream;
      await video.play();
    } catch (error) {
      console.error('Error al abrir la cámara:', error);

      this.detenerCamara();
      this.errorCamara = this.obtenerMensajeErrorCamara(error);
    }
  }

  // ====== Capturar foto ======

  async capturarFoto(): Promise<void> {
    if (
      this.disabled ||
      this.capturando ||
      !this.camaraActiva
    ) {
      return;
    }

    const video = this.videoCamara?.nativeElement;

    if (!video || !video.videoWidth || !video.videoHeight) {
      this.errorCamara =
        'La cámara todavía no está lista para capturar la fotografía.';
      return;
    }

    this.capturando = true;
    this.errorCamara = '';

    try {
      const canvas = this.construirCanvasDesdeVideo(video);
      const blob = await this.generarJpegOptimizado(canvas);

      if (!blob) {
        throw new Error('No se pudo generar la fotografía capturada');
      }

      if (blob.size > this.tamanoMaximoBytes) {
        throw new Error(
          `La fotografía supera el tamaño máximo de ${this.formatearTamano(this.tamanoMaximoBytes)}.`,
        );
      }

      const archivo = new File(
        [blob],
        `evidencia-${Date.now()}.jpg`,
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        },
      );

      this.establecerEvidencia(
        archivo,
        'CAMARA',
      );

      this.detenerCamara();
    } catch (error) {
      console.error('Error al capturar fotografía:', error);

      this.errorCamara =
        error instanceof Error
          ? error.message
          : 'No se pudo capturar la fotografía.';
    } finally {
      this.capturando = false;
    }
  }

  // ====== Abrir selector de archivo ======

  abrirSelectorArchivo(): void {
    if (this.disabled || this.procesandoArchivo) {
      return;
    }

    this.detenerCamara();
    this.errorCamara = '';
    this.errorArchivo = '';

    this.inputArchivo?.nativeElement.click();
  }

  // ====== Seleccionar archivo ======

  async seleccionarArchivo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    if (!archivo) {
      return;
    }

    this.errorArchivo = '';

    const tiposPermitidos = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);

    if (!tiposPermitidos.has(archivo.type)) {
      this.errorArchivo =
        'Solo se admiten imágenes JPEG, PNG o WebP.';
      input.value = '';
      return;
    }

    this.procesandoArchivo = true;

    try {
      const archivoNormalizado =
        archivo.size > this.tamanoMaximoBytes
          ? await this.comprimirArchivo(archivo)
          : archivo;

      if (archivoNormalizado.size > this.tamanoMaximoBytes) {
        throw new Error(
          `La imagen supera el tamaño máximo de ${this.formatearTamano(this.tamanoMaximoBytes)}.`,
        );
      }

      this.establecerEvidencia(
        archivoNormalizado,
        'ARCHIVO',
      );
    } catch (error) {
      console.error('Error al preparar imagen:', error);

      this.errorArchivo =
        error instanceof Error
          ? error.message
          : 'No se pudo preparar la imagen seleccionada.';
    } finally {
      this.procesandoArchivo = false;
      input.value = '';
    }
  }

  // ====== Repetir foto ======

  async repetirFoto(): Promise<void> {
    if (this.disabled) {
      return;
    }

    await this.abrirCamara();
  }

  // ====== Cerrar cámara ======

  cerrarCamara(): void {
    this.detenerCamara();
    this.errorCamara = '';
  }

  // ====== Limpiar evidencia ======

  limpiar(): void {
    this.detenerCamara();
    this.limpiarEvidenciaInterna(true);
    this.errorCamara = '';
    this.errorArchivo = '';
  }

  // ====== Formatear tamaño ======

  formatearTamano(bytes: number): string {
    if (!bytes || bytes <= 0) {
      return '0 B';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  }

  // ====== Construir canvas ======

  private construirCanvasDesdeVideo(
    video: HTMLVideoElement,
  ): HTMLCanvasElement {
    const ladoMaximo = 1280;
    const anchoOrigen = video.videoWidth;
    const altoOrigen = video.videoHeight;
    const escala = Math.min(
      1,
      ladoMaximo / Math.max(anchoOrigen, altoOrigen),
    );

    const canvas = document.createElement('canvas');

    canvas.width = Math.round(anchoOrigen * escala);
    canvas.height = Math.round(altoOrigen * escala);

    const contexto = canvas.getContext('2d');

    if (!contexto) {
      throw new Error('No se pudo preparar la fotografía');
    }

    // ====== Igualar orientación de vista previa ======

    contexto.save();
    contexto.translate(canvas.width, 0);
    contexto.scale(-1, 1);

    contexto.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    contexto.restore();

    return canvas;
  }

  // ====== Comprimir archivo ======

  private async comprimirArchivo(
    archivo: File,
  ): Promise<File> {
    const urlTemporal = URL.createObjectURL(archivo);

    try {
      const imagen = await this.cargarImagen(urlTemporal);
      const ladoMaximo = 1600;
      const escala = Math.min(
        1,
        ladoMaximo /
          Math.max(
            imagen.naturalWidth,
            imagen.naturalHeight,
          ),
      );

      const canvas = document.createElement('canvas');

      canvas.width = Math.round(
        imagen.naturalWidth * escala,
      );
      canvas.height = Math.round(
        imagen.naturalHeight * escala,
      );

      const contexto = canvas.getContext('2d');

      if (!contexto) {
        throw new Error('No se pudo preparar la imagen');
      }

      contexto.fillStyle = '#ffffff';
      contexto.fillRect(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      contexto.drawImage(
        imagen,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await this.generarJpegOptimizado(canvas);

      if (!blob) {
        throw new Error('No se pudo comprimir la imagen');
      }

      const nombreBase = archivo.name.replace(
        /\.[^/.]+$/,
        '',
      );

      return new File(
        [blob],
        `${nombreBase || 'evidencia'}.jpg`,
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        },
      );
    } finally {
      URL.revokeObjectURL(urlTemporal);
    }
  }

  // ====== Generar JPEG optimizado ======

  private async generarJpegOptimizado(
    canvas: HTMLCanvasElement,
  ): Promise<Blob | null> {
    const calidades = [0.86, 0.76, 0.66, 0.56];
    let ultimoBlob: Blob | null = null;

    for (const calidad of calidades) {
      const blob = await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            (resultado) => resolve(resultado),
            'image/jpeg',
            calidad,
          );
        },
      );

      if (!blob) {
        continue;
      }

      ultimoBlob = blob;

      if (blob.size <= this.tamanoMaximoBytes) {
        return blob;
      }
    }

    return ultimoBlob;
  }

  // ====== Cargar imagen ======

  private cargarImagen(
    url: string,
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const imagen = new Image();

      imagen.onload = () => resolve(imagen);
      imagen.onerror = () =>
        reject(
          new Error(
            'No se pudo leer la imagen seleccionada',
          ),
        );
      imagen.src = url;
    });
  }

  // ====== Establecer evidencia ======

  private establecerEvidencia(
    archivo: File,
    origen: OrigenEvidenciaCapturada,
  ): void {
    this.liberarPreview();

    this.archivoSeleccionado = archivo;
    this.origenSeleccionado = origen;
    this.previewUrl = URL.createObjectURL(archivo);

    this.evidenciaChange.emit({
      archivo,
      origen,
    });
  }

  // ====== Limpiar evidencia interna ======

  private limpiarEvidenciaInterna(
    emitirCambio: boolean,
  ): void {
    this.archivoSeleccionado = null;
    this.origenSeleccionado = null;

    this.liberarPreview();

    if (this.inputArchivo?.nativeElement) {
      this.inputArchivo.nativeElement.value = '';
    }

    if (emitirCambio) {
      this.evidenciaChange.emit(null);
    }
  }

  // ====== Liberar preview ======

  private liberarPreview(): void {
    if (!this.previewUrl) {
      return;
    }

    URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  // ====== Detener cámara ======

  private detenerCamara(): void {
    if (this.streamCamara) {
      this.streamCamara
        .getTracks()
        .forEach((track) => track.stop());
    }

    this.streamCamara = null;
    this.camaraActiva = false;

    const video = this.videoCamara?.nativeElement;

    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  // ====== Resolver error de cámara ======

  private obtenerMensajeErrorCamara(
    error: unknown,
  ): string {
    if (error instanceof DOMException) {
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'SecurityError'
      ) {
        return 'No se concedió permiso para usar la cámara. Habilite el permiso del navegador o cargue una imagen.';
      }

      if (error.name === 'NotFoundError') {
        return 'No se encontró una cámara disponible en este dispositivo.';
      }

      if (error.name === 'NotReadableError') {
        return 'La cámara está siendo utilizada por otra aplicación o no está disponible.';
      }
    }

    return 'No se pudo abrir la cámara. Puede cargar una imagen desde el dispositivo.';
  }
}
