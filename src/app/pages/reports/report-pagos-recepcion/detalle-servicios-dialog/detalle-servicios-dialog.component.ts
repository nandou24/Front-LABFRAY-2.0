import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { IPago } from '../../../../models/Gestion/pagos.models';

@Component({
  selector: 'app-detalle-servicios-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>receipt_long</mat-icon>
        Detalle de Servicios
      </h2>
      <button mat-icon-button mat-dialog-close class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- Información del cliente -->
      <mat-card class="info-card">
        <mat-card-content>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Cotización:</span>
              <span class="info-value cotizacion">{{
                data.codCotizacion
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Cliente:</span>
              <span class="info-value">{{ getClienteCompleto() }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Documento:</span>
              <span class="info-value">{{ data.nroDoc }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">HC:</span>
              <span class="info-value">{{ data.hc || 'N/A' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de servicios -->
      <mat-card class="services-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>medical_services</mat-icon>
            Servicios de la Cotización
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table
              mat-table
              [dataSource]="data.serviciosCotizacion"
              class="services-table"
            >
              <!-- Código Column -->
              <ng-container matColumnDef="codigo">
                <th mat-header-cell *matHeaderCellDef>Código</th>
                <td mat-cell *matCellDef="let servicio" class="codigo-cell">
                  {{ servicio.codServicio }}
                </td>
              </ng-container>

              <!-- Servicio Column -->
              <ng-container matColumnDef="servicio">
                <th mat-header-cell *matHeaderCellDef>Servicio</th>
                <td mat-cell *matCellDef="let servicio" class="servicio-cell">
                  <div class="servicio-info">
                    <div class="servicio-nombre">
                      {{ servicio.nombreServicio }}
                    </div>
                    <div class="servicio-tipo" *ngIf="servicio.tipoServicio">
                      {{ servicio.tipoServicio }}
                    </div>
                    <div
                      class="medico-info"
                      *ngIf="esMedicoValido(servicio.medicoAtiende)"
                    >
                      <mat-icon class="medico-icon">person</mat-icon>
                      Dr. {{ servicio.medicoAtiende.nombreRecHumano }}
                      {{ servicio.medicoAtiende.apePatRecHumano }}
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Cantidad Column -->
              <ng-container matColumnDef="cantidad">
                <th mat-header-cell *matHeaderCellDef>Cant.</th>
                <td mat-cell *matCellDef="let servicio" class="cantidad-cell">
                  {{ servicio.cantidad }}
                </td>
              </ng-container>

              <!-- Precio Lista Column -->
              <ng-container matColumnDef="precioLista">
                <th mat-header-cell *matHeaderCellDef>P. Lista</th>
                <td mat-cell *matCellDef="let servicio" class="precio-cell">
                  S/ {{ servicio.precioLista.toFixed(2) }}
                </td>
              </ng-container>

              <!-- Precio Venta Column -->
              <ng-container matColumnDef="precioVenta">
                <th mat-header-cell *matHeaderCellDef>P. Venta</th>
                <td mat-cell *matCellDef="let servicio" class="precio-cell">
                  <div class="precio-info">
                    <div class="precio-valor">
                      S/ {{ servicio.precioVenta.toFixed(2) }}
                    </div>
                    <div
                      class="descuento"
                      *ngIf="servicio.descuentoPorcentaje > 0"
                    >
                      <mat-icon class="descuento-icon">percent</mat-icon>
                      -{{ servicio.descuentoPorcentaje }}%
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Total Column -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let servicio" class="total-cell">
                  S/ {{ (servicio.cantidad * servicio.precioVenta).toFixed(2) }}
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: displayedColumns"
                class="service-row"
              ></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Resumen de totales -->
      <mat-card class="totales-card">
        <mat-card-content>
          <div class="totales-grid">
            <div class="total-item">
              <span class="total-label">Subtotal Servicios:</span>
              <span class="total-value"
                >S/ {{ getSubtotalServicios().toFixed(2) }}</span
              >
            </div>
            <div class="total-item">
              <span class="total-label">Total Facturar:</span>
              <span class="total-value"
                >S/
                {{ (data.totalFacturar || data.total || 0).toFixed(2) }}</span
              >
            </div>
            <div class="total-item destacado">
              <span class="total-label">Falta Pagar:</span>
              <span class="total-value" [ngClass]="getFaltaPagarClass()">
                <mat-icon>{{ getFaltaPagarIcon() }}</mat-icon>
                S/ {{ data.faltaPagar.toFixed(2) }}
              </span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        <mat-icon>close</mat-icon>
        Cerrar
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./detalle-servicios-dialog.component.scss'],
})
export class DetalleServiciosDialogComponent {
  displayedColumns: string[] = [
    'codigo',
    'servicio',
    'cantidad',
    'precioLista',
    'precioVenta',
    'total',
  ];

  constructor(
    public dialogRef: MatDialogRef<DetalleServiciosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPago,
  ) {}

  getClienteCompleto(): string {
    return `${this.data.nombreCliente} ${this.data.apePatCliente} ${this.data.apeMatCliente}`.trim();
  }

  getSubtotalServicios(): number {
    if (!this.data.serviciosCotizacion) return 0;
    return this.data.serviciosCotizacion.reduce(
      (total: number, servicio: any) => {
        return total + servicio.cantidad * servicio.precioVenta;
      },
      0,
    );
  }

  esMedicoValido(medico: any): boolean {
    return (
      medico &&
      medico.nombreRecHumano &&
      medico.nombreRecHumano !== 'null' &&
      medico.nombreRecHumano.trim() !== '' &&
      medico.apePatRecHumano &&
      medico.apePatRecHumano !== 'null' &&
      medico.apePatRecHumano.trim() !== ''
    );
  }

  getFaltaPagarClass(): string {
    return this.data.faltaPagar > 0 ? 'pendiente' : 'completo';
  }

  getFaltaPagarIcon(): string {
    return this.data.faltaPagar > 0 ? 'warning' : 'check_circle';
  }
}
