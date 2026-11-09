class DevelopmentConfig:
    DEBUG = True
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'leonardo'
    MYSQL_PASSWORD = 'root'
    MYSQL_DB = 'examen'
    MYSQL_CURSORCLASS = 'Cursor'


config = {'development': DevelopmentConfig}
