import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RutasService } from '../../../../services/permisos/rutas/rutas.service';
import { IRuta } from '../../../../models/permisos/rutas.models';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';


@Component({
  selector: 'app-rutas',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggle
  ],
  templateUrl: './rutas.component.html',
  styleUrl: './rutas.component.scss'
})
export class RutasComponent {

  private _fb = inject(FormBuilder);
  private _rutasService = inject(RutasService);

  public formRuta: FormGroup = this._fb.group({
    codRuta: [null],
    nombreRuta: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    descripcionRuta: [''],
    urlRuta: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    estado: [true, Validators.required]
  });

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  public rutas: IRuta[] = [];

}
