from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_babel import Babel
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
babel = Babel()


def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    login.login_view = 'main.login'
    babel.init_app(app)
    CORS(app)

    @babel.localeselector
    def get_locale():
        return request.accept_languages.best_match(['en', 'th']) or 'th'

    with app.app_context():
        # import routes and models so they register with app
        from . import routes, models  # noqa: F401
        app.register_blueprint(routes.bp)
        return app
