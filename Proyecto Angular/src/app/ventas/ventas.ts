import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoDetalle, PizzeriaService, Venta } from '../pizzeria.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html'
})
export class VentasComponent implements OnInit, OnChanges {
  @Input() actualizar = false;

  dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  diaConsulta = 'lunes';
  mesConsulta = this.meses[new Date().getMonth()];
  pedidos: Venta[] = [];
  totalGeneral = 0;
  ventasConsulta: Venta[] = [];
  totalConsulta = 0;
  consultaRealizada = false;
  tipoConsulta: 'dia' | 'mes' = 'dia';
  errorConsulta = '';
  pedidoDetalle: PedidoDetalle | null = null;
  cargando = false;
  errorCarga = '';

  constructor(private pizzeriaService: PizzeriaService, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarPedidos();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['actualizar'] && !cambios['actualizar'].firstChange) {
      this.cargarPedidos();
    }
  }

  cargarPedidos(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.pizzeriaService.listarPedidos().subscribe({
      next: (respuesta) => {
        this.pedidos = respuesta.pedidos;
        this.totalGeneral = Number(respuesta.total_acumulado);
        this.cargando = false;
        this.changeDetectorRef.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.pedidos = [];
        this.totalGeneral = 0;
        this.cargando = false;
        this.errorCarga = error.error?.mensaje || 'No se pudo conectar con la API de pedidos.';
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  consultarVentas(tipo: 'dia' | 'mes'): void {
    this.tipoConsulta = tipo;
    this.consultaRealizada = false;
    this.errorConsulta = '';
    this.pedidoDetalle = null;
    const consulta = tipo === 'dia'
      ? this.pizzeriaService.consultarDia(this.diaConsulta)
      : this.pizzeriaService.consultarMes(this.mesConsulta);
    consulta.subscribe({
      next: (respuesta) => {
        this.ventasConsulta = respuesta.ventas;
        this.totalConsulta = Number(respuesta.total_acumulado);
        this.consultaRealizada = true;
        this.changeDetectorRef.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorConsulta = error.error?.mensaje || 'No se pudo consultar las ventas.';
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  verDetalle(id: number): void {
    this.pedidoDetalle = null;
    this.pizzeriaService.verPedido(id).subscribe({
      next: (respuesta) => {
        this.pedidoDetalle = respuesta.pedido;
        this.changeDetectorRef.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.errorCarga = error.error?.mensaje || 'No se pudo consultar el pedido.';
        this.changeDetectorRef.markForCheck();
      }
    });
  }
}
