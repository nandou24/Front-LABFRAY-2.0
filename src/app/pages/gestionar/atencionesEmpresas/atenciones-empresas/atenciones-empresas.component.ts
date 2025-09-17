import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogCrearAtencionComponent } from './dialogs/dialog-crear-atencion/dialog-crear-atencion.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { IAtencionEmpresas } from '../../../../models/Gestion/atencionEmpresa.models';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-atenciones-empresas',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatPaginatorModule,
  ],
  templateUrl: './atenciones-empresas.component.html',
  styleUrl: './atenciones-empresas.component.scss',
})
export class AtencionesEmpresasComponent {
  private dialog = inject(MatDialog);

  abrirDialogCrearAtencion() {
    const dialogRef = this.dialog.open(DialogCrearAtencionComponent, {
      maxWidth: '1000px',
      width: '900px',
      data: {},
    });
    dialogRef.afterClosed().subscribe((pacienteSeleccionado) => {
      //console.log('Paciente seleccionado:', pacienteSeleccionado);
    });
  }

  // Datos de ejemplo para pruebas
  private atencionesEjemplo: IAtencionEmpresas[] = [
    {
      _id: '1',
      empresaId: 'EMP001',
      servicioTipo: 'ETAs',
      fechaRegistro: new Date('2024-01-15'),
      programaciones: [
        {
          fechas: [
            {
              fecha: new Date('2024-02-01'),
              horaInicio: '08:00',
              horaFin: '16:00',
            },
          ],
          sedeEmpresa: 'Sede Principal',
          direccion: 'Av. Principal 123, Lima',
          estado: 'ATENDIDA',
        },
      ],
      estado: 'PAGO_PARCIAL',
      contactosEmpresa: [
        {
          nombre: 'Ana García Constructora SAC',
          cargo: 'Coordinadora SSST',
          telefono: '987654321',
          email: 'ana.garcia@empresa.com',
        },
      ],
    },
    {
      _id: '2',
      empresaId: 'EMP002',
      servicioTipo: 'Campaña',
      fechaRegistro: new Date('2024-01-20'),
      programaciones: [
        {
          fechas: [
            {
              fecha: new Date('2024-02-15'),
              horaInicio: '09:00',
              horaFin: '17:00',
            },
          ],
          sedeEmpresa: 'Oficina Central',
          direccion: 'Jr. Comercio 456, Lima',
          estado: 'PROGRAMADA',
        },
      ],
      estado: 'PROGRAMADA',
      contactosEmpresa: [
        {
          nombre: 'Transportes Unidos EIRL',
          cargo: 'Gerente de RRHH',
          telefono: '965432187',
          email: 'contacto@transportes.com',
        },
      ],
    },
  ];

  dataSourceAtencion = new MatTableDataSource<IAtencionEmpresas>(
    this.atencionesEjemplo,
  );

  // Tabla atenciones vigentes - columnas que se mostrarán
  columnasTablaAtencionEmpresas: string[] = [
    'codAtencion',
    'fechaProgramacion',
    'nombreEmpresa',
    'estadoPago',
    'estadoEvaluacion',
    'acciones',
  ];

  columnsToDisplayWithExpand = [...this.columnasTablaAtencionEmpresas, 'expand'];
  expandedElement: IAtencionEmpresas | null = null;

    /** Checks whether an element is expanded. */
  isExpanded(element: IAtencionEmpresas) {
    return this.expandedElement === element;
  }

  /** Toggles the expanded state of an element. */
  toggle(element: IAtencionEmpresas) {
    this.expandedElement = this.isExpanded(element) ? null : element;
  }

  // Métodos auxiliares para la tabla
  getCodigoAtencion(atencion: IAtencionEmpresas): string {
    return `ATE-${atencion._id?.padStart(6, '0') || '000000'}`;
  }

  getFechaProgramacion(atencion: IAtencionEmpresas): Date | null {
    return atencion.programaciones?.[0]?.fechas?.[0]?.fecha || null;
  }

  getNombreEmpresa(atencion: IAtencionEmpresas): string {
    return atencion.contactosEmpresa?.[0]?.nombre || atencion.empresaId;
  }

  getEstadoPago(atencion: IAtencionEmpresas): string {
    switch (atencion.estado) {
      case 'PENDIENTE_PROGRAMAR':
      case 'PROGRAMADA':
      case 'ATENDIDA':
        return 'PENDIENTE';
      case 'FACTURADA':
        return 'FACTURADO';
      case 'PAGO_PARCIAL':
        return 'PAGO PARCIAL';
      case 'PAGADA':
        return 'PAGADO';
      case 'ANULADA':
        return 'ANULADO';
      default:
        return 'PENDIENTE';
    }
  }

  getEstadoEvaluacion(atencion: IAtencionEmpresas): string {
    return atencion.programaciones?.[0]?.estado || 'PENDIENTE';
  }

  getColorEstadoPago(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'warn';
      case 'FACTURADO':
        return 'accent';
      case 'PAGO PARCIAL':
        return 'warn';
      case 'PAGADO':
        return 'primary';
      case 'ANULADO':
        return '';
      default:
        return '';
    }
  }

  getColorEstadoEvaluacion(estado: string): string {
    switch (estado) {
      case 'PROGRAMADA':
        return 'accent';
      case 'ATENDIDA':
        return 'primary';
      case 'NO_REALIZADA':
        return 'warn';
      default:
        return '';
    }
  }
}
