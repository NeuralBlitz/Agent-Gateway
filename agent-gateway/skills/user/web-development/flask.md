---
name: Flask
category: web-development
description: A lightweight WSGI web application framework in Python for building web apps and APIs
tags:
  - backend
  - python
  - wsgi
  - microframework
---

# Flask

## What I do

I am a lightweight and flexible WSGI web application framework in Python. I provide the essentials for web development—routing, request handling, templating—without imposing any particular pattern or ORM. My minimal core can be extended with plugins to add features like database ORM, authentication, forms, and more. I'm designed for simplicity and flexibility, making me perfect for microservices, REST APIs, and small to medium web applications.

## When to use me

- Building REST APIs and web services
- Microservices requiring minimal overhead
- Small to medium web applications
- Prototyping and rapid development
- When you want full control over your application structure
- Simple websites without complex admin interfaces
- Learning web development with Python
- Projects requiring easy deployment and minimal dependencies

## Core Concepts

- **Application Factory**: create_app() pattern for app initialization
- **Blueprints**: Modular application organization
- **Routes**: URL routing with @app.route() decorators
- **Request/Response**: Handling HTTP requests and building responses
- **Templates**: Jinja2 templating engine integration
- **Extensions**: External libraries extending functionality
- **Config Object**: Application configuration management
- **Context Globals**: Current_app, g, and request context
- **Session Management**: Client-side session handling
- **Error Handling**: Custom error pages and handlers

## Code Examples

### Application Factory Pattern

```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from config import config

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    config[config_name].init_app(app)
    
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    
    from app.routes import main
    from app.routes.auth import auth
    from app.routes.api import api
    
    app.register_blueprint(main)
    app.register_blueprint(auth, url_prefix='/auth')
    app.register_blueprint(api, url_prefix='/api')
    
    from app.models import User
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    return app
```

```python
# config.py
import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = os.environ.get('MAIL_PORT')
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') == 'true'


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

### Routes with Flask

```python
# app/routes/main.py
from flask import render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from .. import db
from ..models import Post
from . import main


@main.route('/')
def index():
    page = request.args.get('page', 1, type=int)
    posts = Post.query.filter_by(status='published')\
        .order_by(Post.created_at.desc())\
        .paginate(page=page, per_page=10)
    return render_template('index.html', posts=posts)


@main.route('/post/<int:post_id>')
def post_detail(post_id):
    post = Post.query.get_or_404(post_id)
    return render_template('post.html', post=post)


@main.route('/about')
def about():
    return render_template('about.html')


@main.route('/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return redirect(url_for('main.index'))
    
    posts = Post.query.filter(
        (Post.title.contains(query)) |
        (Post.content.contains(query))
    ).all()
    
    return render_template('search.html', posts=posts, query=query)
```

```python
# app/routes/auth.py
from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, current_user
from flask_bcrypt import Bcrypt
from .. import db
from ..models import User
from . import auth


@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user, remember=request.form.get('remember'))
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main.index'))
        else:
            flash('Login Unsuccessful. Check email and password', 'danger')
    
    return render_template('login.html')


@auth.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(username=username, email=email, password=hashed_password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Account created! You can now log in.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('register.html')


@auth.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.index'))
```

### REST API with Flask

```python
# app/routes/api.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import User, Post
from . import api


@api.route('/users', methods=['GET'])
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    users = User.query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'users': [user.to_dict() for user in users.items],
        'total': users.total,
        'pages': users.pages,
        'current_page': users.page
    })


@api.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@api.route('/posts', methods=['GET'])
def get_posts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    
    query = Post.query
    
    if status:
        query = query.filter_by(status=status)
    
    posts = query.order_by(Post.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'posts': [post.to_dict() for post in posts.items],
        'total': posts.total,
        'pages': posts.pages
    })


@api.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    current_user_id = get_jwt_identity()
    
    data = request.get_json()
    
    post = Post(
        title=data['title'],
        content=data['content'],
        author_id=current_user_id,
        status=data.get('status', 'draft')
    )
    
    db.session.add(post)
    db.session.commit()
    
    return jsonify(post.to_dict()), 201


@api.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    current_user_id = get_jwt_identity()
    post = Post.query.get_or_404(post_id)
    
    if post.author_id != current_user_id:
        return jsonify({'error': 'Not authorized'}), 403
    
    data = request.get_json()
    
    post.title = data.get('title', post.title)
    post.content = data.get('content', post.content)
    post.status = data.get('status', post.status)
    
    db.session.commit()
    
    return jsonify(post.to_dict())


@api.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    current_user_id = get_jwt_identity()
    post = Post.query.get_or_404(post_id)
    
    if post.author_id != current_user_id:
        return jsonify({'error': 'Not authorized'}), 403
    
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({'message': 'Post deleted'}), 204
```

### Models with SQLAlchemy

```python
# app/models.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    posts = db.relationship('Post', backref='author', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'bio': self.bio,
            'created_at': self.created_at.isoformat()
        }


class Post(db.Model):
    __tablename__ = 'posts'
    
    STATUS_CHOICES = ['draft', 'published']
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    comments = db.relationship('Comment', backref='post', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'content': self.content,
            'status': self.status,
            'author_id': self.author_id,
            'created_at': self.created_at.isoformat()
        }


class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'post_id': self.post_id,
            'author_id': self.author_id,
            'created_at': self.created_at.isoformat()
        }
```

## Best Practices

- **Application Factory**: Use create_app() for testable, configurable applications
- **Blueprints**: Organize routes into blueprints for modularity
- **Configuration Classes**: Use config classes over environment variables directly
- **SQLAlchemy Best Practices**: Use query methods properly and avoid N+1 with eager loading
- **JWT for APIs**: Use flask-jwt-extended for secure token-based authentication
- **Password Hashing**: Always hash passwords with bcrypt or argon2
- **Template Security**: Auto-escape in Jinja2; use |safe only when necessary
- **Error Handling**: Create custom error handlers for consistent API responses
- **Testing**: Use pytest with pytest-flask for testing Flask applications
- **Blueprints for Extensions**: Organize extensions in blueprints for better structure
