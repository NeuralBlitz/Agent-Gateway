---
name: Next.js
category: web-development
description: The React Framework for the Web with server-side rendering, static generation, and modern routing
tags:
  - fullstack
  - react
  - ssr
  - ssg
---

# Next.js

## What I do

I am a React framework developed by Vercel that provides structure, features, and optimizations for building production-ready web applications. I offer multiple rendering strategies including Server-Side Rendering (SSR), Static Site Generation (SSG), and Incremental Static Regeneration (ISR). I handle routing with a file-based system, provide API routes, optimize images and fonts, and support TypeScript out of the box. My App Router architecture enables React Server Components and streaming for better performance.

## When to use me

- Building React applications that need SEO optimization
- Projects requiring multiple rendering strategies (SSR, SSG, ISR)
- When you need server-side capabilities alongside client interactivity
- E-commerce sites, blogs, marketing pages, and documentation
- Large applications benefiting from code splitting and optimization
- When you want a batteries-included React framework
- Projects requiring edge runtime deployment
- Applications needing hybrid rendering approaches

## Core Concepts

- **App Router**: The modern file-based routing system using folder structure
- **Server Components**: Components that render on the server by default
- **Server Actions**: Functions that run on the server, callable from components
- **Streaming**: Streaming React components with Suspense for better UX
- **Data Fetching**: fetch() with caching, revalidating, and deduping
- **Dynamic Routes**: Routes with parameters captured in brackets
- **Layouts**: Shared UI that persists across route changes
- **Metadata API**: Declarative metadata for SEO and social sharing
- **Middleware**: Edge functions that run before requests are completed
- **Image Optimization**: Automatic image optimization with next/image

## Code Examples

### App Router Page

```tsx
// app/users/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import UserProfile from '@/components/UserProfile';
import UserActivity from '@/components/UserActivity';

interface PageProps {
  params: { id: string };
}

async function getUser(id: string) {
  const res = await fetch(`https://api.example.com/users/${id}`, {
    next: { revalidate: 60 }
  });
  
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: PageProps) {
  const user = await getUser(params.id);
  
  if (!user) {
    return { title: 'User Not Found' };
  }
  
  return {
    title: `${user.name} | My App`,
    description: user.bio
  };
}

export default async function UserPage({ params }: PageProps) {
  const user = await getUser(params.id);
  
  if (!user) {
    notFound();
  }

  return (
    <div className="user-page">
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile user={user} />
      </Suspense>
      
      <Suspense fallback={<ActivitySkeleton />}>
        <UserActivity userId={user.id} />
      </Suspense>
    </div>
  );
}

function UserSkeleton() {
  return <div className="animate-pulse">Loading profile...</div>;
}

function ActivitySkeleton() {
  return <div className="animate-pulse">Loading activity...</div>;
}
```

### Server Actions

```tsx
// app/actions/user.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface UserData {
  name: string;
  email: string;
  bio?: string;
}

export async function createUser(formData: FormData) {
  const data: UserData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    bio: formData.get('bio') as string
  };
  
  const errors = validateUserData(data);
  
  if (Object.keys(errors).length > 0) {
    return { errors };
  }
  
  try {
    const res = await fetch('https://api.example.com/users', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error('Failed to create user');
    
    const user = await res.json();
    
    revalidatePath('/users');
    redirect(`/users/${user.id}`);
  } catch (error) {
    return { errors: { form: 'Failed to create user' } };
  }
}

export async function updateUser(id: string, data: UserData) {
  // Implementation
}

export async function deleteUser(id: string) {
  await fetch(`https://api.example.com/users/${id}`, {
    method: 'DELETE'
  });
  
  revalidatePath('/users');
}
```

### Client Component with Hooks

```tsx
// components/UserForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { createUser } from '@/app/actions/user';

export default function UserForm() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createUser(formData);
      
      if (result?.errors) {
        setErrors(result.errors);
      }
    });
  }

  return (
    <form action={handleSubmit} className="user-form">
      <div>
        <label htmlFor="name">Name</label>
        <input 
          id="name" 
          name="name" 
          type="text" 
          required
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="error">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required
        />
        {errors.email && <p className="error">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" rows={4} />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>

      {errors.form && <p className="error">{errors.form}</p>}
    </form>
  );
}
```

### Dynamic Route with Parallel Routes

```tsx
// app/@modal/(.)users/[id]/page.tsx
// Intercepting route for modal display
import { Dialog } from '@/components/Dialog';
import UserProfile from '@/components/UserProfile';

export default function UserModalPage({ params }: { params: { id: string } }) {
  return (
    <Dialog>
      <UserProfile userId={params.id} onClose="/users" />
    </Dialog>
  );
}
```

```tsx
// app/users/layout.tsx
import { Outlet } from 'next/navigation';

export default function UsersLayout({ modal }: { modal: React.ReactNode }) {
  return (
    <div className="users-layout">
      <aside>
        <h1>Users</h1>
        {/* User list */}
      </aside>
      
      <main>
        {modal}
        <Outlet />
      </main>
    </div>
  );
}
```

### Middleware for Authentication

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/settings', '/profile'];
const publicRoutes = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.includes(pathname);
  
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    
    return NextResponse.redirect(loginUrl);
  }
  
  if (isPublicRoute && token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

## Best Practices

- **Server Components First**: Default to Server Components; use 'use client' only when needed
- **Data Fetching**: Use fetch with appropriate caching and revalidation options
- **Streaming with Suspense**: Wrap slow components in Suspense for progressive loading
- **Route Groups**: Use route groups (folder) to organize layouts without affecting URL
- **Parallel Routes**: Use parallel routes (@modal) for modals and intercepting routes
- **Server Actions**: Prefer Server Actions over API routes for form handling
- **Edge Runtime**: Consider Edge runtime for better performance when possible
- **Image Optimization**: Use next/image for automatic optimization and lazy loading
- **Font Optimization**: Use next/font for self-hosted, optimized fonts
- **Bundle Analysis**: Regularly analyze bundle size with @next/bundle-analyzer
