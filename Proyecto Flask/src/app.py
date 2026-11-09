from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from database import mysql
from blueprints.pedidos.routes import pedidos_bp

app = Flask(__name__)
app.config.from_object(config['development'])
CORS(app, resources={r"/api/*": {"origins": "http://localhost:4200"}})
mysql.init_app(app)
app.register_blueprint(pedidos_bp)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'mensaje': 'API de Pizzería disponible', 'exito': True}), 200


@app.errorhandler(404)
def pagina_no_encontrada(error):
    return jsonify({'mensaje': 'Ruta no encontrada', 'exito': False}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
