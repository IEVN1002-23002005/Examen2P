import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pedido.html'
})
export class PedidoComponent implements OnChanges {
  @Input({ required: true }) pizzas!: UntypedFormArray;
  @Input() guardando = false;
  @Output() terminar = new EventEmitter<void>();

  constructor(private formBuilder: UntypedFormBuilder) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pizzas'] && this.pizzas && this.pizzas.length === 0) {
      this.agregarPizza();
    }
  }

  agregarPizza(): void {
    this.pizzas.push(this.formBuilder.group({
      tamano: ['Chica', Validators.required],
      ingredientes: this.formBuilder.array([]),
      num_pizzas: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  quitarPizza(indice: number): void {
    if (this.pizzas.length > 1) {
      this.pizzas.removeAt(indice);
    }
  }

  seleccionarIngrediente(indice: number, ingrediente: string, seleccionado: boolean): void {
    const ingredientes = this.pizzas.at(indice).get('ingredientes') as UntypedFormArray;
    const posicion = ingredientes.value.indexOf(ingrediente);
    if (seleccionado && posicion === -1) {
      ingredientes.push(this.formBuilder.control(ingrediente));
    } else if (!seleccionado && posicion !== -1) {
      ingredientes.removeAt(posicion);
    }
  }

  ingredientesPizza(indice: number): string {
    const ingredientes = this.pizzas.at(indice).get('ingredientes')?.value as string[];
    return ingredientes.length ? ingredientes.join(', ') : 'Queso y salsa';
  }

  precioPizza(indice: number): number {
    const pizza = this.pizzas.at(indice).value;
    const precioBase: Record<string, number> = { Chica: 40, Mediana: 80, Grande: 120 };
    return ((precioBase[pizza.tamano] || 0) + pizza.ingredientes.length * 10) * Number(pizza.num_pizzas || 0);
  }

  get totalPedido(): number {
    return this.pizzas.controls.reduce((total, _pizza, indice) => total + this.precioPizza(indice), 0);
  }
}
