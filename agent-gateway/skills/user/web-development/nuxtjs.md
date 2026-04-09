---
name: Nuxt.js
category: web-development
description: The Hybrid Vue Framework for building modern web applications with SSR, SSG, and auto-imports
tags:
  - fullstack
  - vue
  - ssr
  - ssg
---

# Nuxt.js

## What I do

I am a hybrid Vue framework that makes web development intuitive and powerful. I provide a complete structure with file-based routing, auto-imports, and multiple rendering modes. Built on top of Vue, I add server-side rendering, static site generation, and hybrid rendering capabilities. My module ecosystem extends functionality with SEO tools, image optimization, state management, and more. I'm designed to be flexible—use me for full-stack apps, static sites, or simple SPAs.

## When to use me

- Building Vue applications requiring SEO (SSR or SSG)
- When you want convention-over-configuration for Vue projects
- Creating static sites with Nuxt Content or dynamic pages
- Full-stack applications with server API routes
- Projects needing hybrid rendering strategies
- When you want auto-imports reducing boilerplate
- Building e-commerce, blogs, documentation, or marketing sites
- When you need a cohesive Vue ecosystem with TypeScript support

## Core Concepts

- **Directory Structure**: Organized folders for pages, components, composables, and server code
- **Rendering Modes**: Universal (SSR), Client-Side (SPA), Static (SSG), and Hybrid rendering
- **Auto-imports**: Composables, components, and utilities are auto-imported
- **Nuxt Pages**: File-based routing with dynamic routes and nested layouts
- **Nuxt Layouts**: Shared layouts with slots for page content
- **Data Fetching**: useFetch and useAsyncData for unified data fetching
- **Server Routes**: API endpoints in server/api directory
- **Nuxt Modules**: Plugins that extend Nuxt functionality
- **State Management**: Built-in reactive state with useState
- **Runtime Config**: Environment variables accessible server-side and client-side

## Code Examples

### Page with Data Fetching

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
definePageMeta({
  validate: async (route) => {
    return /^\d+$/.test(route.params.id as string);
  }
});

const route = useRoute();
const { data: user, error, pending, refresh } = await useFetch(
  `/api/users/${route.params.id}`,
  {
    key: `user-${route.params.id}`,
    watch: [() => route.params.id]
  }
);

useHead({
  title: user.value?.name ?? 'User Not Found',
  meta: [
    { name: 'description', content: user.value?.bio }
  ]
});
</script>

<template>
  <div class="user-page">
    <div v-if="pending" class="loading">Loading...</div>
    <div v-else-if="error" class="error">
      <p>Failed to load user</p>
      <button @click="refresh">Retry</button>
    </div>
    <div v-else-if="user" class="content">
      <h1>{{ user.name }}</h1>
      <p>Email: {{ user.email }}</p>
      <p>Role: {{ user.role }}</p>
      
      <NuxtLink to="/users">Back to Users</NuxtLink>
    </div>
  </div>
</template>
```

### Server API Route

```typescript
// server/api/users/index.get.ts
import { users } from '~/server/database';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  
  const [data, total] = await Promise.all([
    users.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' }
    }),
    users.count()
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
});
```

```typescript
// server/api/users/[id].post.ts
import { z } from 'zod';
import { users } from '~/server/database';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'guest'])
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  const result = userSchema.safeParse(body);
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.message
    });
  }
  
  const user = await users.create({
    data: result.data
  });
  
  return user;
});
```

### Composables

```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useSupabaseUser();
  const client = useSupabaseClient();
  const router = useRouter();
  
  const login = async (email: string, password: string) => {
    const { error } = await client.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    router.push('/dashboard');
  };
  
  const logout = async () => {
    const { error } = await client.auth.signOut();
    
    if (error) throw error;
    router.push('/login');
  };
  
  const register = async (email: string, password: string, name: string) => {
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    
    if (error) throw error;
  };
  
  return {
    user,
    login,
    logout,
    register,
    isAuthenticated: computed(() => !!user.value)
  };
};
```

### Plugin and Middleware

```typescript
// plugins/api-errors.ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('showError', (error) => {
    const { statusCode, message } = error;
    
    if (statusCode === 401) {
      return navigateTo('/login');
    }
    
    console.error('API Error:', error);
  });
});
```

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser();
  
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});
```

```typescript
// app.vue
<script setup lang="ts">
const { user, logout } = useAuth();
</script>

<template>
  <div>
    <nav>
      <NuxtLink to="/">Home</NuxtLink>
      
      <template v-if="user">
        <NuxtLink to="/dashboard">Dashboard</NuxtLink>
        <NuxtLink to="/settings">Settings</NuxtLink>
        <button @click="logout">Logout</button>
      </template>
      <NuxtLink v-else to="/login">Login</NuxtLink>
    </nav>
    
    <NuxtPage />
  </div>
</template>
```

### State Management with useState

```typescript
// composables/useCart.ts
export const useCart = () => {
  const cart = useState<CartItem[]>('cart', () => []);
  
  const addItem = (product: Product, quantity = 1) => {
    const existing = cart.value.find(i => i.id === product.id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.value.push({ ...product, quantity });
    }
  };
  
  const removeItem = (productId: string) => {
    cart.value = cart.value.filter(i => i.id !== productId);
  };
  
  const clear = () => {
    cart.value = [];
  };
  
  const itemCount = computed(() => 
    cart.value.reduce((sum, i) => sum + i.quantity, 0)
  );
  
  const total = computed(() =>
    cart.value.reduce((sum, i) => sum + (i.price * i.quantity), 0)
  );
  
  return {
    cart,
    addItem,
    removeItem,
    clear,
    itemCount,
    total
  };
};
```

## Best Practices

- **Composables for Logic**: Extract reusable logic into composables with clear responsibilities
- **Server-Side by Default**: Let Nuxt handle SSR; use client-only for browser APIs
- **Proper Error Handling**: Use createError and error handling middleware
- **Type Safety**: Use TypeScript throughout for better developer experience
- **Runtime Config**: Store secrets in NUXT_SECRET_* variables for server-only access
- **Auto-imports Awareness**: Be aware of auto-imported composables when searching usages
- **Modules First**: Use established modules like @nuxtjs/tailwindcss, @nuxt/image
- **Route Validation**: Use definePageMeta validate for route parameter validation
- **Payload Extraction**: Use payload.nuxt.data for client-side navigation optimization
- **SSR Hydration**: Handle hydration mismatches carefully in async components
