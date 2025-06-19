  import { CommonModule } from '@angular/common';
  import { Component, inject, OnInit } from '@angular/core';
  import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
  import { MatButtonModule } from '@angular/material/button';
  import { MatCardModule } from '@angular/material/card';
  import { MatNativeDateModule, MatOption } from '@angular/material/core';
  import { MatDatepickerModule } from '@angular/material/datepicker';
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatIconModule } from '@angular/material/icon';
  import { MatInputModule } from '@angular/material/input';
  import { MatSelectModule } from '@angular/material/select';
  import { MatTableDataSource, MatTableModule } from '@angular/material/table';
  import { CotizacionPersonalService } from '../../../../services/gestion/cotizaciones/cotizacion-personal.service';
  import { ICotizacion, IHistorialCotizacion } from '../../../../models/cotizacionPersona.models';
  import { IDetallePago, IPago } from '../../../../models/pagos.models';
  import { PagosCotizacionPersonalService } from '../../../../services/gestion/pagos/pagos-cotizacion-personal.service';
  import Swal from 'sweetalert2';

  @Component({
    selector: 'app-gest-pago-coti-persona',
    imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatCardModule,
      MatTableModule,
      MatOption,
      MatIconModule,
      MatButtonModule,
      MatSelectModule,
      MatDatepickerModule,
      MatNativeDateModule
    ],
    templateUrl: './gest-pago-coti-persona.component.html',
    styleUrl: './gest-pago-coti-persona.component.scss'
  })
  export class GestPagoCotiPersonaComponent implements OnInit {

    private _cotizacionService = inject(CotizacionPersonalService);
    private _pagoService = inject(PagosCotizacionPersonalService);
    private _fb = inject(FormBuilder);

    ngOnInit(): void {
      this.ultimasCotizaciones(10);
      this.ultimosPagos(10);
      this.escucharCambioMotivoAnulacion();
    }

    public myFormPagoPersona: FormGroup = this._fb.group({

        codPago: [{ value: '', disabled: true }],
        fechaPago: [{ value: '', disabled: true }],
        codCotizacion: [{ value: '', disabled: true }],
        version: [{ value: 0, disabled: true }],
        fechaCotizacion: [{ value: '', disabled: true }],
        estadoCotizacion: [{ value: '', disabled: true }],
        codCliente: [{ value: '', disabled: true }],
        nomCliente: [{ value: '', disabled: true }],
        tipoDoc: [{ value: '', disabled: true }],
        nroDoc: [{ value: '', disabled: true }],
        codSolicitante: [{ value: '', disabled: true }],
        nomSolicitante: [{ value: '', disabled: true }],
        profesionSolicitante: [{ value: '', disabled: true }],
        colegiatura: [{ value: '', disabled: true }],

        sumaTotalesPrecioLista: 0,
        descuentoTotal: 0,
        subTotal: 0,
        igv: 0,
        total: 0,
        serviciosCotizacion: this._fb.array([], Validators.required),
        detallePagos: this._fb.array([], Validators.required),
        faltaPagar: 0,
        subTotalFacturar: [{ value: 0, disabled: true }],
        igvFacturar: [{ value: 0, disabled: true }],
        totalFacturar: [{ value: 0, disabled: true }],
        estadPago: '',
        anulacionPago: this._fb.group({
          motivo: [''],
          observacion: ['']
        }),
    });

    get serviciosCotizacion(): FormArray{
        return this.myFormPagoPersona.get('serviciosCotizacion') as FormArray;
    }

    get detallePagos(): FormArray{
      return this.myFormPagoPersona.get('detallePagos') as FormArray;
    }

    get anulacionPago(): FormGroup {
      return this.myFormPagoPersona.get('anulacionPago') as FormGroup;
    }

    setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
      return `0 0 ${valor}${unidad}`;
    }

    columnasTablaServiciosCotizados: string[] = ['codigo', 'tipo', 'nombre', 'cantidad', 'precioLista', 'diferencia', 'precioVenta', 'descuentoPorcentaje', 'totalUnitario'];
    dataSourceServiciosCotizados = new MatTableDataSource<FormGroup>([]);

    agregarPago() {

      const pagoItem = this._fb.group({
        fechaPago: [new Date(), [Validators.required]],
        medioPago: ['', [Validators.required]],
        monto: [{ value: '', disabled: true }, [Validators.required, Validators.min(0.01)]],
        recargo: [{ value: 0, disabled: true }],
        //montoFacturar: [null, [Validators.required, Validators.min(0.01)]],
        numOperacion: [{ value: '', disabled: true }],
        bancoDestino: [{ value: '', disabled: true }],
      });

      // Escuchar cambios en el método de pago
      pagoItem.get('medioPago')?.valueChanges.subscribe((metodo: string | null) => {
        if(metodo){
          this.actualizarHabilitacionCamposPago(pagoItem, metodo);
        }
      });

      // Escuchar cambios en monto para calcular recargo si aplica
      pagoItem.get('monto')?.valueChanges.subscribe((monto: string | null) => {
        const metodo = pagoItem.get('medioPago')?.value;
        const montoNumber = monto ? parseFloat(monto) : 0;
        if(montoNumber){
          if ((metodo === 'Tarjeta Crédito' || metodo === 'Tarjeta Débito') && montoNumber > 0) {
            const recargo = Math.round(montoNumber * 0.05 * 1000) / 1000; // 5% de recargo
            pagoItem.get('recargo')?.setValue(recargo, { emitEvent: false });
          }
        }

      });

      this.detallePagos.push(pagoItem);

    }

    private actualizarHabilitacionCamposPago(grupo: FormGroup, metodo: string): void {
      const monto = grupo.get('monto');
      const recargo = grupo.get('recargo');
      const numOperacion = grupo.get('numOperacion');
      const banco = grupo.get('bancoDestino');

      // 🔄 Primero: deshabilitar y limpiar validadores
      [monto, recargo, numOperacion, banco].forEach(control => {
        control?.disable();
        control?.reset();
        control?.clearValidators();
        control?.updateValueAndValidity();
      });

      // 🔧 Luego: habilitar y aplicar validadores dinámicos
      if (metodo === 'Efectivo') {
        monto?.enable();
        monto?.setValidators([Validators.required, Validators.min(0.01)]);
      }

      if (metodo === 'Transferencia') {
        monto?.enable();
        monto?.setValidators([Validators.required, Validators.min(0.01)]);
        numOperacion?.enable();
        numOperacion?.setValidators([Validators.required]);
        banco?.enable();
        banco?.setValidators([Validators.required]);
      }

      if (metodo === 'Yape' || metodo === 'Plin') {
        monto?.enable();
        monto?.setValidators([Validators.required, Validators.min(0.01)]);
        numOperacion?.enable();
        numOperacion?.setValidators([Validators.required]);
      }

      if (metodo === 'Tarjeta Crédito' || metodo === 'Tarjeta Débito') {
        monto?.enable();
        monto?.setValidators([Validators.required, Validators.min(0.01)]);
        //recargo?.enable(); // Se calcula automáticamente, pero igual se puede editar si lo deseas
      }

      // ✅ Recalcular validadores
      [monto, recargo, numOperacion, banco].forEach(control => {
        control?.updateValueAndValidity();
      });
    }

    removerPago(index: number){
      this.detallePagos.removeAt(index);
    }

    //necesito que el control faltaPagar se actualice cada vez que se agregue o elimine un pago

    actualizarFaltaPagar() {

      const totalCotizacion = this.myFormPagoPersona.get('total')?.value || 0;

      let totalPagado = 0;
      let totalAFacturar = 0;

      this.detallePagos.controls.forEach(pago => {
        const monto = +pago.get('monto')?.value || 0;
        const recargo = +pago.get('recargo')?.value || 0;

        totalPagado += monto;
        totalAFacturar += monto + recargo;
      });

      const faltaPagar = Math.round((totalCotizacion - totalPagado) * 100) / 100;

      const subTotalFacturar = Math.round((totalAFacturar / 1.18) * 1000) / 1000;
      const igvFacturar = Math.round((totalAFacturar - subTotalFacturar) * 1000) / 1000;
      const totalFacturar = Math.round(totalAFacturar * 100) / 100;

      this.myFormPagoPersona.patchValue({
        faltaPagar: faltaPagar,
        subTotalFacturar: subTotalFacturar,
        igvFacturar: igvFacturar,
        totalFacturar: totalFacturar
      });

    }

    // COTIZACIONES
    timeoutBusqueda: any;
    terminoBusquedaCotizacion = new FormControl('');
    cotizaciones: ICotizacion[] = [];

    ultimasCotizaciones(cantidad: number): void {

      this._cotizacionService.getLatestCotizacioPorPagar(cantidad).subscribe({

        next: (res: ICotizacion[]) => { this.cotizaciones = res; },
        error: (err: any) => { this.cotizaciones = []; },

      });

    }

    buscarCotizaciones() {

      clearTimeout(this.timeoutBusqueda);

      this.timeoutBusqueda = setTimeout(() => {

        const termino = this.terminoBusquedaCotizacion.value?.trim() || '';
        
        if (termino.length >= 3) {
          this._cotizacionService.getCotizacion(termino).subscribe((res: ICotizacion[]) => {
            this.cotizaciones = res;
          });
        } else if (termino.length > 0) {
          this.cotizaciones = [];
        } else {
          this.ultimasCotizaciones(10);
        }


      }, 200);
    }

    seSeleccionoCotizacion: boolean = false
    seSeleccionoPago: boolean = false
    
    cargarCotizacion(cotizacion: ICotizacion){

      let ultimaVersion!: IHistorialCotizacion;

      this.myFormPagoPersona.reset();
      this.seSeleccionoCotizacion = true
      this.seSeleccionoPago = false
      this.detallePagos.clear();
      this.cancelarAnulacion();
      this.tienePagos = false;
      
      //buscando la última versión del historial
      const historial = cotizacion.historial;
      ultimaVersion = historial[historial.length - 1];

      // 📌 Cargar datos del paciente
      this.myFormPagoPersona.patchValue({
        codCotizacion: cotizacion.codCotizacion,
        estadoCotizacion: cotizacion.estadoCotizacion,
        version: ultimaVersion.version,
        fechaCotizacion: ultimaVersion.fechaModificacion,
        codCliente: ultimaVersion.codCliente,
        nomCliente: ultimaVersion.nomCliente,
        tipoDoc: ultimaVersion.tipoDoc,
        nroDoc: ultimaVersion.nroDoc,
        codSolicitante: ultimaVersion.codSolicitante,
        nomSolicitante: ultimaVersion.nomSolicitante,
        profesionSolicitante: ultimaVersion.profesionSolicitante,
        colegiatura: ultimaVersion.colegiatura,
        sumaTotalesPrecioLista: ultimaVersion.sumaTotalesPrecioLista,
        descuentoTotal: ultimaVersion.descuentoTotal,
        subTotal: ultimaVersion.subTotal,
        igv: ultimaVersion.igv,
        total: ultimaVersion.total,
      });

      // 📌 Cargar servicios
      this.serviciosCotizacion.clear(); // Limpiar antes de cargar

      ultimaVersion.serviciosCotizacion.forEach((servicio: any) => {
        this.serviciosCotizacion.push(this.crearServiciosCotizacionGroup(servicio));
      });

      this.dataSourceServiciosCotizados.data = this.serviciosCotizacion.controls as FormGroup[];

    }

    private crearServiciosCotizacionGroup(servicio: any): FormGroup {
      return this._fb.group({
        codServicio: [servicio.codServicio, Validators.required],
        tipoServicio: [servicio.tipoServicio, Validators.required],
        nombreServicio: [servicio.nombreServicio, Validators.required],
        cantidad: [servicio.cantidad, [Validators.required, Validators.min(1)]],
        precioLista: [servicio.precioLista, [Validators.required, Validators.min(0)]],
        diferencia: [servicio.diferencia],
        precioVenta: [servicio.precioVenta, [Validators.required, Validators.min(0)]],
        descuentoPorcentaje: [servicio.descuentoPorcentaje, [Validators.min(0), Validators.max(100)]],
        totalUnitario: [servicio.totalUnitario, [Validators.required, Validators.min(0)]]
      });
    }

    // PAGOS
    pagos: IPago[] = [];

    ultimosPagos(cantidad:number): void {
      this._pagoService.getPagos(cantidad).subscribe({
        next: (res: IPago[]) => {this.pagos = res;},
        error: (err) => {console.error('Error al obtener las cotizaciones:', err);},
      });
    }

    tienePagos: boolean = false;

    cargarPagos(pago: IPago){

      this.myFormPagoPersona.reset();
      this.detallePagos.clear();
      this.serviciosCotizacion.clear();

      this.seSeleccionoCotizacion = true;
      this.seSeleccionoPago = true;
      this.tienePagos = true;
      this.cancelarAnulacion();

      // Cargar campos del formulario
      this.myFormPagoPersona.patchValue({
        codPago: pago.codPago,
        codCotizacion: pago.codCotizacion,
        version: pago.version,
        estadoCotizacion: pago.estadoCotizacion,
        codCliente: pago.codCliente,
        nomCliente: pago.nomCliente,
        tipoDoc: pago.tipoDoc,
        nroDoc: pago.nroDoc,
        codSolicitante: pago.codSolicitante,
        nomSolicitante: pago.nomSolicitante,
        profesionSolicitante: pago.profesionSolicitante,
        colegiatura: pago.colegiatura,
        sumaTotalesPrecioLista: pago.sumaTotalesPrecioLista,
        descuentoTotal: pago.descuentoTotal,
        subTotal: pago.subTotal,
        igv: pago.igv,
        total: pago.total,
        faltaPagar: pago.faltaPagar,
        subTotalFacturar: pago.subTotalFacturar,
        igvFacturar: pago.igvFacturar,
        totalFacturar: pago.totalFacturar,
        estadPago: pago.estadoPago
      });

      // Servicios cotizados
      pago.serviciosCotizacion.forEach(servicio => {
        this.serviciosCotizacion.push(this.crearServiciosCotizacionGroup(servicio));
      });
      this.dataSourceServiciosCotizados.data = this.serviciosCotizacion.controls as FormGroup[];

      // Detalle de pagos realizados (modo solo lectura)
      pago.detallePagos.forEach(detalle => {
        const pagoGroup = this._fb.group({
          fechaPago: new Date(detalle.fechaPago),
          medioPago: [detalle.medioPago],
          monto: [detalle.monto],
          recargo: [detalle.recargo],
          numOperacion: [detalle.numOperacion],
          bancoDestino: [detalle.bancoDestino],
        });
        pagoGroup.disable(); // ❗ Solo lectura
        this.detallePagos.push(pagoGroup);
      });

    }

    //necesito que al momento de agregar pagos, la suma de estos no supere el total de la cotización
    //necesito que el retorno de esta función sea un booleano, si es true, se puede registrar el pago, si es false, no se puede registrar el pago
    validarArrayPagos(): boolean {

      if (this.detallePagos.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Debe agregar al menos un pago.',
        });
        return false;
      }else{
        return true
      }
    
    }

    validarMontoMayor(): boolean {

      const totalPagado = this.detallePagos.controls.reduce((total, pago) => {
        return total + (pago.get('monto')?.value || 0);
      }, 0);

      console.log('Total Pagado:', totalPagado);

      const totalCotizacion = this.myFormPagoPersona.get('total')?.value || 0;

      if (totalPagado > totalCotizacion) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El total de los pagos no puede superar el total de la cotización.',
        });
        return false;
      }else{
        return true;
      }

    }

    registrarPagos() {

      if(this.seSeleccionoCotizacion === false){
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Debe seleccionar una cotización antes de registrar un pago.',
        });
        return;
      }

      if (!this.validarArrayPagos()) {
        return;
      }

      if (!this.validarMontoMayor()) {
        return;
      }

      if (this.myFormPagoPersona.invalid) {
        this.myFormPagoPersona.markAllAsTouched();
        console.log('Formulario inválido');
        return;
      }

      const falta = Number(this.myFormPagoPersona.get('faltaPagar')?.value || 0);
      const tienePagosAnteriores = this.detallePagos.value.some((p: any) => p.esAntiguo);

      console.log('Formulario válido, registrando pagos...');

      if (falta > 0) {
        Swal.fire({
          title: 'Pago parcial',
          icon: 'warning',
          html: `Aún falta pagar <strong>S/ ${falta.toFixed(2)}</strong>.<br><br>¿Deseas registrar este pago parcial?`,
          showCancelButton: true,
          confirmButtonText: 'Sí, registrar pago parcial',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#f59e0b'
        }).then((result) => {
          if (result.isConfirmed) {
            this.enviarVenta('PAGO PARCIAL', tienePagosAnteriores);
          }
        });
      } else {
        Swal.fire({
          title: '¿Registrar venta?',
          text: 'La venta será registrada como pagada en su totalidad.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, registrar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#198754'
        }).then((result) => {
          if (result.isConfirmed) {
            this.enviarVenta('PAGO TOTAL', tienePagosAnteriores);
          }
        });
      }

    }

    enviarVenta(estado: 'PAGO TOTAL' | 'PAGO PARCIAL', tienePagosAnteriores: boolean) {
      
      const pago = this.myFormPagoPersona.getRawValue();
      pago.estadoCotizacion = estado;
      pago.estadoPago = estado;
      pago.fechaPago = new Date();
      pago.tienePagosAnteriores = tienePagosAnteriores;

      // 🔁 Formatear todas las fechas de los pagos a tipo Date
      pago.detallePagos = pago.detallePagos.map((p: any) => ({
        ...p,
      }));
    
      this._pagoService.registrarPago(pago).subscribe({
        next: (data) => {
          Swal.fire({
            title: 'Confirmado',
            text: data.msg,
            icon: 'success',
            confirmButtonText: 'Ok'
          });
          this.nuevoPago();
        },
        error: (err) => {
          const mensaje = err?.error?.msg || err.message || 'No se pudo registrar el pago. Intenta nuevamente.';
    
          Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Ok'
          });
        }
      });
    }

    nuevoPago(){

      this.myFormPagoPersona.reset(); // Reinicia todos los campos del formulario
      this.detallePagos.clear();
      this.serviciosCotizacion.clear();
      this.seSeleccionoCotizacion = false;
      this.seSeleccionoPago= false;
      //this.filaCotizacionPorPagarSeleccionada = null;
      this.cotizaciones = [];
      this.ultimosPagos(10);
      this.ultimasCotizaciones(10);
      this.anulacionPago.reset(); // Limpia el grupo de anulacion
      this.terminoBusquedaCotizacion.reset(); // Limpia el campo de búsqueda de cot

    }


    cancelarOperacion(){

    }

    mostrarSeccionAnulacion: boolean = false;

    activarModoAnulacion() {
      this.mostrarSeccionAnulacion = true;
      this.myFormPagoPersona.get('anulacionPago.motivo')?.setValidators([Validators.required]);
      this.myFormPagoPersona.get('anulacionPago.motivo')?.updateValueAndValidity();
    }

    calcularMontoTotalPagado(): number {
      return this.detallePagos.controls.reduce((total, pago) => {
        const monto = +pago.get('monto')?.value || 0;
        const recargo = +pago.get('recargo')?.value || 0;
        return total + monto + recargo;
      }, 0);
    }

    calcularMonto(): number {
      return this.detallePagos.controls.reduce((total, pago) => {
        const monto = +pago.get('monto')?.value || 0;
        return total + monto;
      }, 0);
    }

    calcularRecargo(): number {
      return this.detallePagos.controls.reduce((total, pago) => {
        const recargo = +pago.get('recargo')?.value || 0;
        return total + recargo;
      }, 0);
    }

    cancelarAnulacion() {
      this.mostrarSeccionAnulacion = false;
      this.anulacionPago.reset();
      this.myFormPagoPersona.get('anulacionPago')?.reset();
      this.myFormPagoPersona.get('anulacionPago.motivo')?.clearValidators();
      this.myFormPagoPersona.get('anulacionPago.motivo')?.updateValueAndValidity();     
    }


    escucharCambioMotivoAnulacion(): void {
      const anulacionGroup = this.myFormPagoPersona.get('anulacionPago') as FormGroup;

      anulacionGroup.get('motivo')?.valueChanges.subscribe(motivo => {
        const observacionControl = anulacionGroup.get('observacion');

        if (motivo === 'Otro') {
          observacionControl?.setValidators([Validators.required]);
        } else {
          observacionControl?.clearValidators();
        }

        observacionControl?.updateValueAndValidity();
      });
    }
    confirmarAnulacion() {

      const anulacionGroup = this.myFormPagoPersona.get('anulacionPago') as FormGroup;
      if (anulacionGroup.invalid) {
        anulacionGroup.markAllAsTouched();
        return;
      }

      const motivo = anulacionGroup.get('motivo')?.value;
      const observacion = anulacionGroup.get('observacion')?.value;
      const codPago = this.myFormPagoPersona.get('codPago')?.value;

      Swal.fire({
        title: 'Confirmar Anulación',
        text: `¿Estás seguro de anular el pago ${codPago} por el motivo: "${motivo}"?${observacion ? `\nObservación: ${observacion}` : ''}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
      }).then((result) => {
        if (result.isConfirmed) {
          this._pagoService.anularPago(codPago, motivo, observacion).subscribe({
            next: (data) => {
              Swal.fire({
                title: 'Anulación Exitosa',
                text: data.msg,
                icon: 'success',
                confirmButtonText: 'Ok'
              });
              this.nuevoPago();
            },
            error: (err) => {
              const mensaje = err?.error?.msg || err.message || 'No se pudo anular el pago. Intenta nuevamente.';
              Swal.fire({
                title: 'Error al Anular',
                text: mensaje,
                icon: 'error',
                confirmButtonText: 'Ok'
              });
            }
          });
        }
      });


    }

  }
