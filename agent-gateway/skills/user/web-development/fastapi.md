---
name: FastAPI
category: web-development
description: A modern, fast Python web framework for building APIs with automatic documentation
tags:
  - backend
  - python
  - api
  - async
---

# FastAPI

## What I do

I am a modern, fast (high-performance) Python web framework for building APIs with Python 3.6+ based on standard Python type hints. I leverage Starlette for web parts and Pydantic for data parts, providing automatic data validation, serialization, and interactive API documentation. I support asynchronous programming with async/await, dependency injection, and produce OpenAPI schemas automatically. I'm designed for building production-ready APIs quickly with less code and fewer bugs.

## When to use me

- Building REST APIs and microservices
- When you need automatic API documentation (Swagger/ReDoc)
- Projects requiring high-performance async Python
- Data-heavy applications with complex validation needs
- When you want automatic OpenAPI/Swagger generation
- Building Python backend services with type safety
- Rapid API development with less boilerplate
- Projects needing WebSocket support

## Core Concepts

- **Path Operations**: Decorators like @app.get() for defining API endpoints
- **Pydantic Models**: Data validation and serialization using type hints
- **Dependency Injection**: Inject dependencies into path operations
- **Async/Await**: Native asynchronous support for I/O operations
- **Request Validation**: Automatic validation of path, query, and body parameters
- **Response Models**: Automatic response serialization and documentation
- **Authentication**: OAuth2, JWT, and HTTP Basic authentication support
- **Background Tasks**: Execute tasks after response is sent
- **WebSockets**: Full-duplex communication support
- **OpenAPI/Swagger**: Automatic API documentation generation

## Code Examples

### Main Application Setup

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .routers import users, posts, auth
from .database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown


app = FastAPI(
    title="My API",
    description="A modern API built with FastAPI",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])


@app.get("/")
async def root():
    return {"message": "Welcome to My API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Pydantic Models and Database

```python
# models.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    id: int
    bio: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str


class PostCreate(PostBase):
    pass


class PostResponse(PostBase):
    id: int
    author_id: int
    status: str
    created_at: datetime
    author: UserResponse
    
    class Config:
        from_attributes = True


class PostWithComments(PostResponse):
    comments: List[CommentResponse]


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentResponse(BaseModel):
    id: int
    content: str
    author_id: int
    post_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
```

### Dependencies and Authentication

```python
# dependencies.py
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from .database import get_db
from . import models

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def authenticate_user(db: Session, username: str, password: str):
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
            
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User)\
        .filter(models.User.username == token_data.username)\
        .first()
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return current_user
```

### Path Operations

```python
# routers/posts.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_active_user


router = APIRouter()


@router.get("/", response_model=List[schemas.PostResponse])
async def read_posts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    posts = db.query(models.Post)\
        .filter(models.Post.author_id == current_user.id)\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return posts


@router.get("/{post_id}", response_model=schemas.PostResponse)
async def read_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return post


@router.post("/", response_model=schemas.PostResponse, status_code=201)
async def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_post = models.Post(
        **post.model_dump(),
        author_id=current_user.id
    )
    
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    
    return db_post


@router.put("/{post_id}", response_model=schemas.PostResponse)
async def update_post(
    post_id: int,
    post_update: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    post.title = post_update.title
    post.content = post_update.content
    
    db.commit()
    db.refresh(post)
    
    return post


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(post)
    db.commit()
    
    return None
```

## Best Practices

- **Pydantic Models**: Use Pydantic for all data validation and serialization
- **Response Models**: Always specify response models for documentation
- **Async Throughout**: Use async/await consistently for I/O operations
- **Dependency Injection**: Use dependencies for shared logic (DB, auth)
- **Type Hints**: Leverage Python type hints fully for validation
- **Separation of Concerns**: Organize into routers, models, and services
- **Exception Handling**: Create custom exceptions for consistent error responses
- **Background Tasks**: Use BackgroundTasks for non-critical operations
- **Testing**: Use pytest with TestClient for testing endpoints
- **OpenAPI**: Take advantage of auto-generated documentation
