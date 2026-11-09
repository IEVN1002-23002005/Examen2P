from datetime import datetime
from decimal import Decimal
from flask import Blueprint, jsonify, request
from database import mysql

pedidos_bp = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')

PRECIOS_TAMANO = {'Chica': Decimal('40.00'), 'Mediana': Decimal('80.00'), 'Grande': Decimal('120.00')}
PRECIO_INGREDIENTE = Decimal('10.00')
INGREDIENTES_VALIDOS = {'Jamon', 'Piña', 'Champiñones'}


def fila_a_diccionario(cursor, fila):
    columnas = [columna[0] for columna in cursor.description]
    return dict(zip(columnas, fila))


def validar_pedido(datos):
    campos = ('nombre_cliente', 'direccion', 'telefono', 'fecha_pedido', 'pizzas')
    if not datos or any(not datos.get(campo) for campo in campos):
        return None, 'Completa los datos del cliente y agrega por lo menos una pizza'
    try:
        datetime.strptime(datos['fecha_pedido'], '%Y-%m-%d')
    except (TypeError, ValueError):
        return None, 'La fecha debe tener el formato YYYY-MM-DD'
    if not isinstance(datos['pizzas'], list) or not datos['pizzas']:
        return None, 'El pedido debe incluir por lo menos una pizza'

    detalles = []
    total = Decimal('0.00')
    for pizza in datos['pizzas']:
        tamano = pizza.get('tamano')
        ingredientes = pizza.get('ingredientes')
        try:
            cantidad = int(pizza.get('num_pizzas', 0))
        except (TypeError, ValueError):
            cantidad = 0
        if tamano not in PRECIOS_TAMANO or cantidad < 1:
            return None, 'Selecciona un tamaño válido y una cantidad mayor a cero'
        if not isinstance(ingredientes, list) or any(item not in INGREDIENTES_VALIDOS for item in ingredientes):
            return None, 'Selecciona ingredientes válidos'
        precio_unitario = PRECIOS_TAMANO[tamano] + PRECIO_INGREDIENTE * len(ingredientes)
        subtotal = precio_unitario * cantidad
        total += subtotal
        detalles.append({
            'tamano': tamano,
            'ingredientes': ', '.join(ingredientes) if ingredientes else 'Queso y salsa',
            'num_pizzas': cantidad,
            'subtotal': subtotal
        })
    return {'detalles': detalles, 'total': total}, None


@pedidos_bp.route('/', methods=['GET'])
def listar_pedidos():
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id_pedido, nombre_cliente, direccion, telefono, fecha_pedido, total_pedido FROM pedidos ORDER BY fecha_pedido DESC, id_pedido DESC")
        filas = cursor.fetchall()
        pedidos = [fila_a_diccionario(cursor, fila) for fila in filas]
        total = sum((Decimal(str(pedido['total_pedido'])) for pedido in pedidos), Decimal('0.00'))
        return jsonify({
            'pedidos': pedidos,
            'total_acumulado': str(total),
            'mensaje': 'Lista de pedidos',
            'exito': True
        }), 200
    except Exception:
        return jsonify({'mensaje': 'Error al consultar los pedidos', 'exito': False}), 500
    finally:
        if cursor is not None:
            cursor.close()


@pedidos_bp.route('/', methods=['POST'])
def registrar_pedido():
    cursor = None
    try:
        datos = request.get_json()
        pedido, error = validar_pedido(datos)
        if error:
            return jsonify({'mensaje': error, 'exito': False}), 400

        cursor = mysql.connection.cursor()
        cursor.execute(
            "INSERT INTO pedidos (nombre_cliente, direccion, telefono, fecha_pedido, total_pedido) VALUES (%s, %s, %s, %s, %s)",
            (datos['nombre_cliente'].strip(), datos['direccion'].strip(), datos['telefono'].strip(), datos['fecha_pedido'], pedido['total'])
        )
        id_pedido = cursor.lastrowid
        for detalle in pedido['detalles']:
            cursor.execute(
                "INSERT INTO detalles_pedido (id_pedido, tamano, ingredientes, num_pizzas, subtotal) VALUES (%s, %s, %s, %s, %s)",
                (id_pedido, detalle['tamano'], detalle['ingredientes'], detalle['num_pizzas'], detalle['subtotal'])
            )
        mysql.connection.commit()
        return jsonify({'id_pedido': id_pedido, 'total_pedido': str(pedido['total']), 'mensaje': 'Pedido registrado correctamente', 'exito': True}), 201
    except Exception:
        mysql.connection.rollback()
        return jsonify({'mensaje': 'Error al registrar el pedido. Verifica la conexión y las tablas.', 'exito': False}), 500
    finally:
        if cursor is not None:
            cursor.close()


@pedidos_bp.route('/ventas/dia', methods=['GET'])
def ventas_por_dia():
    cursor = None
    try:
        dia = request.args.get('dia', '').strip().lower()
        dias = {'lunes': 0, 'martes': 1, 'miercoles': 2, 'miércoles': 2, 'jueves': 3, 'viernes': 4, 'sabado': 5, 'sábado': 5, 'domingo': 6}
        if dia not in dias:
            return jsonify({'mensaje': 'Indica un día de la semana válido', 'exito': False}), 400
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id_pedido, nombre_cliente, direccion, telefono, fecha_pedido, total_pedido FROM pedidos WHERE WEEKDAY(fecha_pedido)=%s ORDER BY fecha_pedido", (dias[dia],))
        filas = cursor.fetchall()
        ventas = [fila_a_diccionario(cursor, fila) for fila in filas]
        total = sum((Decimal(str(venta['total_pedido'])) for venta in ventas), Decimal('0.00'))
        return jsonify({'ventas': ventas, 'total_acumulado': str(total), 'mensaje': 'Ventas del día consultadas', 'exito': True}), 200
    except Exception:
        return jsonify({'mensaje': 'Error al consultar las ventas del día', 'exito': False}), 500
    finally:
        if cursor is not None:
            cursor.close()


@pedidos_bp.route('/ventas/mes', methods=['GET'])
def ventas_por_mes():
    cursor = None
    try:
        mes = request.args.get('mes', '').strip().lower()
        meses = {'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12}
        if mes not in meses:
            return jsonify({'mensaje': 'Indica un mes válido en español', 'exito': False}), 400
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id_pedido, nombre_cliente, direccion, telefono, fecha_pedido, total_pedido FROM pedidos WHERE MONTH(fecha_pedido)=%s ORDER BY fecha_pedido", (meses[mes],))
        filas = cursor.fetchall()
        ventas = [fila_a_diccionario(cursor, fila) for fila in filas]
        total = sum((Decimal(str(venta['total_pedido'])) for venta in ventas), Decimal('0.00'))
        return jsonify({'ventas': ventas, 'total_acumulado': str(total), 'mensaje': 'Ventas del mes consultadas', 'exito': True}), 200
    except Exception:
        return jsonify({'mensaje': 'Error al consultar las ventas del mes', 'exito': False}), 500
    finally:
        if cursor is not None:
            cursor.close()


@pedidos_bp.route('/<int:id_pedido>', methods=['GET'])
def detalle_pedido(id_pedido):
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id_pedido, nombre_cliente, direccion, telefono, fecha_pedido, total_pedido FROM pedidos WHERE id_pedido=%s", (id_pedido,))
        fila = cursor.fetchone()
        if not fila:
            return jsonify({'mensaje': 'Pedido no encontrado', 'exito': False}), 404
        pedido = fila_a_diccionario(cursor, fila)
        cursor.execute("SELECT id_detalle, tamano, ingredientes, num_pizzas, subtotal FROM detalles_pedido WHERE id_pedido=%s", (id_pedido,))
        pedido['detalles'] = [fila_a_diccionario(cursor, detalle) for detalle in cursor.fetchall()]
        return jsonify({'pedido': pedido, 'mensaje': 'Detalle del pedido', 'exito': True}), 200
    except Exception:
        return jsonify({'mensaje': 'Error al consultar el detalle del pedido', 'exito': False}), 500
    finally:
        if cursor is not None:
            cursor.close()
