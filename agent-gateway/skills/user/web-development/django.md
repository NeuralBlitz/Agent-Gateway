---
name: Django
category: web-development
description: The Python Web Framework for Perfectionists with Batteries Included
tags:
  - backend
  - python
  - fullstack
  - orm
---

# Django

## What I do

I am a high-level Python web framework that enables rapid development of secure and maintainable websites. I follow the "batteries included" philosophy, providing almost everything needed for web development out of the box. I feature an object-relational mapper (ORM) for database operations, a templating system, form handling, user authentication, and an admin interface. My architecture follows the Model-View-Template (MVT) pattern, promoting clean, DRY code and rapid development.

## When to use me

- Building database-driven websites and web applications
- Projects requiring rapid development with conventions
- When you need a full-featured admin interface automatically
- Content management systems and publishing platforms
- E-commerce platforms with complex product catalogs
- Scientific or data-heavy applications with web interfaces
- Enterprise applications needing security and scalability
- When Python is your team's primary language

## Core Concepts

- **Models**: Python classes defining database schema with ORM
- **Views**: Functions or class-based views handling HTTP requests
- **Templates**: Django Template Language (DTL) for HTML rendering
- **URLs**: URLconf for routing requests to views
- **MVT Pattern**: Model-View-Template architecture
- **ORM**: Object-Relational Mapper for database abstraction
- **Migrations**: Schema changes tracked and applied systematically
- **Admin Interface**: Auto-generated CRUD interface for models
- **Forms**: Form handling with validation and model forms
- **Middleware**: Request/response processing hooks

## Code Examples

### Model with Relationships

```python
# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator


class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.username


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Post(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='posts'
    )
    content = models.TextField()
    excerpt = models.CharField(max_length=300)
    featured_image = models.ImageField(upload_to='posts/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('post_detail', kwargs={'slug': self.slug})


class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author} on {self.post}"
```

### Views and URL Configuration

```python
# views.py
from django.views.generic import ListView, DetailView, CreateView
from django.views.decorators.http import require_http_methods
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.http import JsonResponse
from django.db.models import Count, Q
from .models import Post, Category, Comment
from .forms import CommentForm


class PostListView(ListView):
    model = Post
    template_name = 'blog/post_list.html'
    context_object_name = 'posts'
    paginate_by = 10

    def get_queryset(self):
        queryset = Post.objects.filter(status='published')
        
        category_slug = self.kwargs.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        search = self.request.GET.get('q')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )
        
        return queryset.select_related('author', 'category')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.filter(parent=None)
        return context


class PostDetailView(DetailView):
    model = Post
    template_name = 'blog/post_detail.html'
    context_object_name = 'post'
    query_pk_and_slug = True

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['comment_form'] = CommentForm()
        context['comments'] = self.object.comments.filter(active=True)
        return context


class PostCreateView(LoginRequiredMixin, CreateView):
    model = Post
    fields = ['title', 'category', 'content', 'excerpt', 'featured_image']
    template_name = 'blog/post_form.html'
    success_url = reverse_lazy('post_list')

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)


@require_http_methods(['POST'])
def add_comment(request, slug):
    post = get_object_or_404(Post, slug=slug)
    
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    form = CommentForm(request.POST)
    
    if form.is_valid():
        comment = form.save(commit=False)
        comment.post = post
        comment.author = request.user
        comment.save()
        
        return JsonResponse({
            'id': comment.id,
            'author': comment.author.username,
            'content': comment.content,
            'created_at': comment.created_at.isoformat()
        })
    
    return JsonResponse({'errors': form.errors}, status=400)
```

### URL Configuration

```python
# urls.py
from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.PostListView.as_view(), name='post_list'),
    path('post/<slug:slug>/', views.PostDetailView.as_view(), name='post_detail'),
    path('post/<slug:slug>/comment/', views.add_comment, name='add_comment'),
    path('category/<slug:slug>/', views.PostListView.as_view(), name='category_detail'),
    path('author/<str:username>/', views.PostListView.as_view(), name='author_detail'),
]

# blog/urls.py
from django.urls import path
from .views import PostCreateView

app_name = 'blog'

urlpatterns = [
    path('create/', PostCreateView.as_view(), name='post_create'),
]
```

### Models and QuerySets

```python
# managers.py
from django.db import models


class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status='published')


class PostManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('author', 'category')

    def published(self):
        return self.get_queryset().filter(status='published')

    def by_category(self, category):
        return self.get_queryset().filter(category=category)

    def search(self, query):
        from django.db.models import Q
        return self.get_queryset().filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(excerpt__icontains=query)
        )

    def with_comment_count(self):
        return self.get_queryset().annotate(
            comment_count=models.Count('comments')
        ).order_by('-comment_count')
```

### Settings and Configuration

```python
# settings.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ['DJANGO_SECRET_KEY']

DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'blog',
    'accounts',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

AUTH_USER_MODEL = 'accounts.User'

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

## Best Practices

- **Class-Based Views**: Use CBVs for complex views to reduce code duplication
- **Generic Relations**: Use Django's built-in generic relations for polymorphic content
- **select_related/prefetch_related**: Optimize queries to avoid N+1 problems
- **Custom Managers**: Create custom managers for common query patterns
- **Signals**: Use signals sparingly; prefer explicit method calls
- **Database Transactions**: Use atomic() for grouped database operations
- **Security Headers**: Configure security middleware for production
- **Static Files**: Use WhiteNoise or cloud storage for production static files
- **Testing**: Use Django's test framework with pytest-django
- **Environment Variables**: Store secrets in environment variables, not settings
