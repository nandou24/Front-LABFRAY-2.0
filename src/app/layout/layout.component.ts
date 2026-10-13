import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener, ViewChild, inject } from '@angular/core';
import { SidenavComponent } from './sidenav/sidenav.component';
import { Router, RouterModule } from '@angular/router';
import {
  MatDrawer,
  MatSidenav,
  MatSidenavModule,
} from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { AlertasCriticasResultadosService } from '../services/gestion/alertasResultados/alertas-criticas-resultados.service';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterModule,
    SidenavComponent,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly _breakpointObserver = inject(BreakpointObserver);
  private readonly _router = inject(Router);
  private readonly _alertasCriticas = inject(AlertasCriticasResultadosService);

  readonly estadoAlertas$ = this._alertasCriticas.estado$;

  @ViewChild('criticalAlertTrigger')
  criticalAlertTrigger?: MatMenuTrigger;

  isMobile = false;
  private breakpointSubscription?: Subscription;

  ngOnInit() {
    // ====== Consultar alerta crítica al ingresar al sistema ======
    this._alertasCriticas.reiniciar();
    this._alertasCriticas.refrescar();

    // Detectar si es dispositivo móvil/tablet
    this.breakpointSubscription = this._breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  ngOnDestroy() {
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
  }

  // ====== Recuperar alerta al volver desde suspensión / segundo plano ======
  @HostListener('window:focus')
  onWindowFocus(): void {
    this._alertasCriticas.refrescarSiCorresponde();
  }

  @HostListener('window:pageshow')
  onPageShow(): void {
    this._alertasCriticas.refrescarSiCorresponde();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (!document.hidden) {
      this._alertasCriticas.refrescarSiCorresponde();
    }
  }

  toggleSidenav(sidenav: MatSidenav) {
    sidenav.toggle();
  }

  irAVencidos(): void {
    // ====== Cerrar desplegable antes de navegar ======
    this.criticalAlertTrigger?.closeMenu();

    void this._router.navigate(['/pages/entrega-resultados'], {
      queryParams: { vencidos: '1' },
    });
  }
}
