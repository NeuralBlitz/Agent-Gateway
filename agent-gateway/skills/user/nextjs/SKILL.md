---
name: nextjs
description: Next.js full-stack React framework with SSR, API routes, and file-based routing
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: frameworks
---
## What I do
- Build server-side rendered React applications
- Create API routes and serverless functions
- Implement file-based routing with dynamic routes
- Use getStaticProps, getServerSideProps, and getStaticPaths
- Optimize performance with SSR, SSG, and ISR
- Handle authentication with NextAuth.js
- Use TypeScript for type safety

## When to use me
When building modern React applications with SSR, API routes, or full-stack capabilities.

## Pages Router
```typescript
// pages/index.tsx
import { GetServerSideProps } from 'next'

interface Props {
  data: User[]
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const res = await fetch('https://api.example.com/users')
  const data = await res.json()
  
  return {
    props: { data },
  }
}

export default function Home({ data }: Props) {
  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## App Router (Next.js 13+)
```typescript
// app/page.tsx
import { getData } from '@/lib/data'

export default async function Page() {
  const data = await getData()
  
  return <main>{data.title}</main>
}

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

// app/api/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello' })
}
```

## Dynamic Routes
```typescript
// app/posts/[id]/page.tsx
interface Props {
  params: { id: string }
}

export default async function Post({ params }: Props) {
  const post = await fetchPost(params.id)
  return <article>{post.content}</article>
}

export async function generateStaticParams() {
  const posts = await fetchAllPosts()
  return posts.map(post => ({ id: post.id }))
}
```

## Client Components
```typescript
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  )
}
```

## Server Actions
```typescript
// app/actions.ts
'use server'

export async function createUser(formData: FormData) {
  const name = formData.get('name')
  // Database operation
  await db.user.create({ name: name as string })
  revalidatePath('/users')
}
```
