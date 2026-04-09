---
name: django
description: Django web framework best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: frameworks
---
## What I do
- Build Django applications following best practices
- Use class-based views for complex logic
- Implement proper model design with migrations
- Handle forms and model forms
- Use Django ORM effectively
- Implement authentication and permissions
- Create REST APIs with Django REST Framework
- Write unit and integration tests

## When to use me
When building Django applications or APIs.

## Project Structure
```
myproject/
├── myproject/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── users/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── serializers.py
│   │   ├── forms.py
│   │   ├── admin.py
│   │   ├── permissions.py
│   │   ├── throttling.py
│   │   ├── apps.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_models.py
│   │       └── test_views.py
│   └── posts/
│       └── ...
├── templates/
│   └── base.html
├── static/
│   ├── css/
│   └── js/
├── media/
├── locale/
├── manage.py
├── requirements.txt
├── pytest.ini
└── .env
```

## Models
```python
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, URLValidator
from django.utils import timezone
from django.conf import settings


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username


class Post(BaseModel):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    content = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[('draft', 'Draft'), ('published', 'Published')],
        default='draft'
    )
    published_at = models.DateTimeField(null=True, blank=True)
    tags = models.ManyToManyField('Tag', related_name='posts')
    views = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['-published_at']),
            models.Index(fields=['author', '-published_at']),
        ]

    def save(self, *args, **kwargs):
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    def __str__(self):
        return self.name
```

## Class-Based Views
```python
from django.views.generic import (
    ListView, DetailView, CreateView, UpdateView, DeleteView
)
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.core.exceptions import PermissionDenied
from rest_framework.generics import ListAPIView


class PostListView(ListView):
    model = Post
    template_name = 'posts/list.html'
    context_object_name = 'posts'
    paginate_by = 10

    def get_queryset(self):
        return Post.objects.filter(
            status='published'
        ).select_related('author').prefetch_related('tags')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'All Posts'
        return context


class PostDetailView(DetailView):
    model = Post
    template_name = 'posts/detail.html'
    context_object_name = 'post'

    def get_queryset(self):
        return Post.objects.select_related('author').prefetch_related('tags')


class PostCreateView(LoginRequiredMixin, CreateView):
    model = Post
    fields = ['title', 'content', 'tags']
    template_name = 'posts/form.html'
    success_url = reverse_lazy('posts:list')

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)


class PostUpdateView(LoginRequiredMixin, UpdateView):
    model = Post
    fields = ['title', 'content', 'tags']
    template_name = 'posts/form.html'

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)

    def get_object(self, queryset=None):
        post = super().get_object()
        if post.author != self.request.user:
            raise PermissionDenied
        return post


class PostDeleteView(LoginRequiredMixin, DeleteView):
    model = Post
    success_url = reverse_lazy('posts:list')

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)
```

## Django REST Framework
```python
from rest_framework import serializers, viewsets, permissions
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes


class PostSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'author',
            'status', 'published_at', 'tags', 'views',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'author', 'views', 'created_at', 'updated_at']


@extend_schema(
    parameters=[
        OpenApiParameter(name='search', description='Search in title and content'),
        OpenApiParameter(name='status', description='Filter by status'),
    ]
)
class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Post.objects.select_related('author').prefetch_related('tags')

        # Filtering
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# URLs
from django.urls import path, include
from rest_framework.routers import DefaultRouter


router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
```
