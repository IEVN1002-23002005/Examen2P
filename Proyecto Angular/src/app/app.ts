import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { PedidoNuevo, PizzeriaService } from './pizzeria.service';
import { ClienteComponent } from './cliente/cliente';
import { PedidoComponent } from './pedido/pedido';
import { VentasComponent } from './ventas/ventas';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ClienteComponent, PedidoComponent, VentasComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class App {
  pedidoForm: UntypedFormGroup;
  mensaje = '';
  tipoMensaje = '';
  guardando = false;
  actualizarPedidos = false;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private pizzeriaService: PizzeriaService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.pedidoForm = this.formBuilder.group({
      nombre_cliente: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required],
      fecha_pedido: [this.fechaActual(), Validators.required],
      pizzas: this.formBuilder.array([])
    });
  }

  get pizzas(): UntypedFormArray {
    return this.pedidoForm.get('pizzas') as UntypedFormArray;
  }

  terminarPedido(): void {
    this.mensaje = '';
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      this.mostrarMensaje('Completa los datos del cliente y revisa las pizzas.', 'error');
      return;
    }
    const datos = this.pedidoForm.getRawValue() as PedidoNuevo;
    this.guardando = true;
    this.pizzeriaService.registrarPedido(datos).subscribe({
      next: (respuesta) => {
        this.guardando = false;
        this.mostrarMensaje('Pedido #' + respuesta.id_pedido + ' guardado. Total a pagar: $' + respuesta.total_pedido, 'exito');
        this.pedidoForm.reset({ nombre_cliente: '', direccion: '', telefono: '', fecha_pedido: this.fechaActual() });
        this.pedidoForm.setControl('pizzas', this.formBuilder.array([]));
        this.actualizarPedidos = !this.actualizarPedidos;
        this.changeDetectorRef.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.mostrarMensaje(error.error?.mensaje || 'No se pudo conectar con la API. Revisa Flask y MySQL.', 'error');
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  private fechaActual(): string {
    const hoy = new Date();
    return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  }

  private mostrarMensaje(texto: string, tipo: string): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
  }
}
