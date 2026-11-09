import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface PizzaPedido {
  tamano: string;
  ingredientes: string[];
  num_pizzas: number;
}

export interface PedidoNuevo {
  nombre_cliente: string;
  direccion: string;
  telefono: string;
  fecha_pedido: string;
  pizzas: PizzaPedido[];
}

export interface Venta {
  id_pedido: number;
  nombre_cliente: string;
  direccion: string;
  telefono: string;
  fecha_pedido: string;
  total_pedido: number;
}

export interface DetallePizza {
  id_detalle: number;
  tamano: string;
  ingredientes: string;
  num_pizzas: number;
  subtotal: number;
}

export interface PedidoDetalle extends Venta {
  detalles: DetallePizza[];
}

@Injectable({ providedIn: 'root' })
export class PizzeriaService {
  private apiUrl = 'http://127.0.0.1:5000/api/pedidos';

  constructor(private http: HttpClient) { }

  registrarPedido(datos: PedidoNuevo): Observable<{ id_pedido: number; total_pedido: string; mensaje: string; exito: boolean }> {
    return this.http.post<{ id_pedido: number; total_pedido: string; mensaje: string; exito: boolean }>(this.apiUrl + '/', datos);
  }

  listarPedidos(): Observable<{ pedidos: Venta[]; total_acumulado: string; mensaje: string; exito: boolean }> {
    return this.http.get<{ pedidos: Venta[]; total_acumulado: string; mensaje: string; exito: boolean }>(this.apiUrl + '/');
  }

  consultarDia(dia: string): Observable<{ ventas: Venta[]; total_acumulado: string; mensaje: string; exito: boolean }> {
    return this.http.get<{ ventas: Venta[]; total_acumulado: string; mensaje: string; exito: boolean }>(this.apiUrl + '/ventas/dia?dia=' + encodeURIComponent(dia));
  }

  consultarMes(mes: string): Observable<{ ventas: Venta[]; total_acumulado: string; mensaje: string; exito: boolean }> {
    return this.http.get<{ ventas: Venta[]; total_acumulado: string; mensaje: string; exito: boolean }>(this.apiUrl + '/ventas/mes?mes=' + encodeURIComponent(mes));
  }

  verPedido(id: number): Observable<{ pedido: PedidoDetalle; mensaje: string; exito: boolean }> {
    return this.http.get<{ pedido: PedidoDetalle; mensaje: string; exito: boolean }>(this.apiUrl + '/' + id);
  }
}
