---
name: Laravel
category: web-development
description: A PHP framework for web artisans with expressive syntax and modern tooling
tags:
  - backend
  - php
  - mvc
  - modern
---

# Laravel

## What I Do

Laravel is a PHP framework created by Taylor Otwell, designed for web artisans. I provide an expressive syntax while offering powerful features for modern web development. I follow the Model-View-Controller (MVC) pattern and include features like Eloquent ORM for database operations, Blade templating, routing, authentication, and caching. I'm designed to make development enjoyable while producing robust, scalable applications.

I excel at building database-driven web applications, REST APIs, and enterprise systems. My artisan CLI provides powerful commands for common tasks. My ecosystem includes Laravel Forge for server management, Laravel Vapor for serverless deployment, and Horizon for queue management. Composer manages dependencies efficiently.

## When to Use Me

Choose Laravel when building PHP applications with rapid development needs. I work well for projects requiring complex database operations with Eloquent ORM. Laravel is ideal for teams familiar with PHP wanting modern tooling and patterns. Avoid Laravel for simple scripts or when PHP hosting is unavailable.

## Core Concepts

Laravel applications use Eloquent ORM for database operations with intuitive Active Record implementations. Blade templates provide lightweight templating with inheritance and components. The service container handles dependency injection with automatic resolution. Service providers bootstrap application components. Routes map HTTP requests to controller actions with middleware support. Migrations version database schema changes. Queues process jobs asynchronously. Eloquent relationships define database associations.

## Code Examples

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'status',
        'user_id',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_published' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function tags()
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at');
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where('title', 'like', "%{$search}%")
            ->orWhere('content', 'like', "%{$search}%");
    }
}
```

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = Post::published()
            ->with(['user', 'category', 'tags'])
            ->when($request->category, fn($q, $cat) => $q->where('category_id', $cat))
            ->when($request->search, fn($q, $search) => $q->search($search))
            ->orderBy('published_at', 'desc')
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'data' => PostResource::collection($posts),
            'meta' => [
                'total' => $posts->total(),
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
            ]
        ]);
    }

    public function show(Post $post): JsonResponse
    {
        return response()->json(new PostResource($post));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'content' => 'required|string|min:50',
            'category_id' => 'nullable|exists:categories,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
        ]);

        $post = auth()->user()->posts()->create($validated);
        $post->tags()->sync($request->tags ?? []);

        return response()->json(new PostResource($post), 201);
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $this->authorize('update', $post);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:200',
            'content' => 'sometimes|string|min:50',
            'status' => 'sometimes|in:draft,published',
        ]);

        $post->update($validated);

        return response()->json(new PostResource($post));
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);
        $post->delete();

        return response()->json(null, 204);
    }
}
```

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\UserService;
use App\Repositories\UserRepository;
use App\Repositories\Interfaces\UserRepositoryInterface;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            UserRepositoryInterface::class,
            UserRepository::class
        );

        $this->app->singleton(UserService::class, function ($app) {
            return new UserService(
                $app->make(UserRepositoryInterface::class)
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
```

```php
<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateAdminUser extends Command
{
    protected $signature = 'users:create-admin {email} {name?}';
    protected $description = 'Create an admin user';

    public function handle(): int
    {
        $email = $this->argument('email');
        $name = $this->argument('name') ?? $this->ask('Enter name');

        if (User::where('email', $email)->exists()) {
            $this->error('User already exists!');
            return Command::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => bcrypt($this->secret('Enter password')),
            'role' => 'admin',
        ]);

        $this->info("Admin user created: {$user->email}");
        return Command::SUCCESS;
    }
}
```

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class PostApiTest extends TestCase
{
    public function test_user_can_create_post(): void
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)
            ->postJson('/api/posts', [
                'title' => 'Test Post',
                'content' => 'This is test content for the post.',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'title', 'content']
            ]);
    }

    public function test_guest_cannot_create_post(): void
    {
        $response = $this->postJson('/api/posts', [
            'title' => 'Test Post',
            'content' => 'Content',
        ]);

        $response->assertStatus(401);
    }
}
```

## Best Practices

Use Eloquent relationships effectively with proper eager loading to avoid N+1 queries. Implement service classes for complex business logic separate from controllers. Use Form Requests for validation logic. Implement policies for authorization. Use queues for time-consuming operations. Use events and listeners for decoupled functionality. Write feature tests covering API endpoints. Use database migrations for schema changes. Implement repository pattern for database abstraction.

## Common Patterns

The repository pattern abstracts data access with Eloquent. The service layer pattern encapsulates business logic. The policy pattern handles authorization logic. The observer pattern uses Eloquent observers for model events. The command bus pattern queues jobs for background processing. The resource transform pattern formats API responses.
