import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogCrearAtencionComponent } from './dialogs/dialog-crear-atencion/dialog-crear-atencion.component';

@Component({
  selector: 'app-atenciones-empresas',
  imports: [MatButtonModule, MatIconModule, MatDividerModule, MatDialogModule],
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
      console.log('Paciente seleccionado:', pacienteSeleccionado);
    });

    // const dlg = this.dialog.open(DialogCrearAtencionComponent, {
    //   width: '900px',
    //   maxWidth: '95vw',
    //   maxHeight: '95vh',
    //   autoFocus: false,
    //   panelClass: 'dlg-atencion',
    // });

    // dlg.afterClosed().subscribe((result) => {
    //   if (result) {
    //     // TODO: llamar a tu service para guardar en backend
    //     // this.atencionesService.crear(result).subscribe(...)
    //   }
    // });
  }
}
