import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ArchivoPacienteService } from '../../../services/mantenimiento/paciente/archivo-paciente.service';

// ====== Miniatura de fotografía de evaluación (no foto de perfil) ======
@Component({
  selector: 'app-foto-paciente-miniatura',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="foto-evaluacion" [class.foto-evaluacion-grande]="tamano === 'grande'"
      (mouseenter)="ampliar($event)" (mouseleave)="cerrarAmpliacion()"
      [attr.title]="mensaje" (click)="$event.stopPropagation()">
      <img *ngIf="estado === 'disponible' && urlImagen" [src]="urlImagen"
        alt="Fotografía de evaluación" (error)="errorImagen()" />
      <span *ngIf="estado !== 'disponible'">
        {{ estado === 'cargando' ? 'Cargando…' : estado === 'error' ? 'Error foto' : 'Sin foto' }}
      </span>
    </div>
    <div *ngIf="ampliada && estado === 'disponible' && urlImagen"
      class="foto-evaluacion-ampliada" [style.left.px]="posicionX" [style.top.px]="posicionY"
      aria-label="Fotografía de evaluación ampliada">
      <img [src]="urlImagen" alt="Fotografía de evaluación ampliada" />
    </div>
  `,
  styles: [`
    :host { display:inline-flex; flex:0 0 auto; vertical-align:middle; }
    .foto-evaluacion { width:86px; height:96px; box-sizing:border-box; overflow:hidden;
      border-radius:8px; border:1px solid #bdd3ef; background:#f0f5fc;
      display:flex; align-items:center; justify-content:center; cursor:zoom-in; }
    .foto-evaluacion-grande { width:102px; height:110px; }
    .foto-evaluacion img { display:block; width:100%; height:100%; object-fit:cover; }
    .foto-evaluacion span { color:#657b98; font-size:11px; line-height:1.3; text-align:center; padding:5px; }
    .foto-evaluacion-ampliada { position:fixed; z-index:3000; width:286px; max-height:340px;
      padding:6px; box-sizing:border-box; border:1px solid #b4cbea; border-radius:10px;
      background:white; box-shadow:0 16px 40px rgba(15,36,70,.28); pointer-events:none; }
    .foto-evaluacion-ampliada img { display:block; max-height:326px; width:100%; object-fit:contain; border-radius:6px; }
  `],
})
export class FotoPacienteMiniaturaComponent implements OnChanges, OnDestroy {
  @Input() pacienteId: string | null | undefined = null;
  @Input() hc: string | null | undefined = null;
  @Input() programacionEmpresaId: string | null | undefined = null;
  @Input() solicitudAtencionId: string | null | undefined = null;
  @Input() tamano: 'normal' | 'grande' = 'normal';

  private readonly servicio = inject(ArchivoPacienteService);
  private solicitud?: Subscription;
  estado: 'cargando' | 'disponible' | 'sin-foto' | 'error' = 'cargando';
  mensaje = 'Consultando fotografía de evaluación';
  urlImagen: string | null = null;
  ampliada = false;
  posicionX = 0;
  posicionY = 0;

  ngOnChanges(cambios: SimpleChanges): void {
    if (!['pacienteId', 'hc', 'programacionEmpresaId', 'solicitudAtencionId'].some(c => cambios[c])) return;
    this.cargar();
  }

  private cargar(): void {
    this.solicitud?.unsubscribe();
    this.liberarImagen();
    if (!this.programacionEmpresaId && !this.solicitudAtencionId) {
      this.estado = 'sin-foto';
      this.mensaje = 'Sin evaluación vinculada a esta solicitud';
      return;
    }
    this.estado = 'cargando';
    this.mensaje = 'Consultando fotografía de evaluación';
    const referencia = {
      pacienteId: this.pacienteId,
      hc: this.hc,
      programacionEmpresaId: this.programacionEmpresaId,
      solicitudAtencionId: this.solicitudAtencionId,
    };
    this.solicitud = this.servicio.obtenerFotoEvaluacionCacheada(referencia).subscribe({
      next: resultado => {
        if (!resultado.disponible) {
          this.estado = 'sin-foto';
          this.mensaje = 'Sin fotografía de evaluación registrada';
          return;
        }
        const imagen = resultado.imagen;
        if (!imagen) {
          this.estado = 'error';
          this.mensaje = 'El servidor no devolvió una fotografía';
          return;
        }
        if (!imagen.size || !imagen.type.startsWith('image/')) {
          this.estado = 'error';
          this.mensaje = 'El servidor no devolvió una imagen válida';
          this.invalidarImagenEnCache();
          return;
        }
        this.urlImagen = URL.createObjectURL(imagen);
        this.estado = 'disponible';
        this.mensaje = 'Fotografía de evaluación · pasa el mouse para ampliar';
      },
      error: error => {
        console.error('Consulta de fotografía de evaluación:', error);
        this.estado = 'error';
        this.mensaje = error?.status === 403
          ? 'Sin permiso de lectura S3 (s3:GetObject para pacientes/*)'
          : error?.status === 409
            ? 'Inconsistencia entre paciente, HC y evaluación'
            : error?.status === 404
              ? 'Fotografía no localizada en S3'
              : 'Error al consultar fotografía de evaluación';
      },
    });
  }

  errorImagen(): void {
    this.estado = 'error';
    this.mensaje = 'No se pudo mostrar la imagen recibida';
    this.invalidarImagenEnCache();
    this.liberarImagen();
  }

  private invalidarImagenEnCache(): void {
    this.servicio.invalidarFotoEvaluacion({
      programacionEmpresaId: this.programacionEmpresaId,
      solicitudAtencionId: this.solicitudAtencionId,
    });
  }

  ampliar(evento: MouseEvent): void {
    if (this.estado !== 'disponible') return;
    const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    const ancho = 286;
    const alto = 340;
    this.posicionX = Math.max(8, Math.min(rect.right + 12, window.innerWidth - ancho - 8));
    this.posicionY = rect.bottom + alto + 10 > window.innerHeight
      ? Math.max(8, rect.top - alto - 10)
      : rect.bottom + 10;
    this.ampliada = true;
  }

  cerrarAmpliacion(): void { this.ampliada = false; }

  private liberarImagen(): void {
    this.cerrarAmpliacion();
    if (this.urlImagen) URL.revokeObjectURL(this.urlImagen);
    this.urlImagen = null;
  }

  ngOnDestroy(): void {
    this.solicitud?.unsubscribe();
    this.liberarImagen();
  }
}
