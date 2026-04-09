---
name: svelte
description: Svelte reactive JavaScript framework with compile-time optimization
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: frameworks
---
## What I do
- Build reactive web applications with less boilerplate
- Use Svelte's reactivity system with stores
- Create component animations and transitions
- Write scoped CSS in components
- Use SvelteKit for full-stack apps
- Handle server-side rendering
- Implement context API for dependency injection

## When to use me
When building highly performant web apps with minimal JavaScript output.

## Component Syntax
```svelte
<script>
  let count = 0
  let doubled = $derived(count * 2)
  
  function increment() {
    count += 1
  }
  
  $: console.log('count is', count)
</script>

<button on:click={increment}>
  Clicks: {count}
  Doubled: {doubled}
</button>

<style>
  button {
    padding: 1rem;
  }
</style>
```

## Stores
```typescript
// stores.ts
import { writable, derived } from 'svelte/store'

export const count = writable(0)

export const doubled = derived(count, $count => $count * 2)

// Custom store
function createTimer() {
  const { subscribe, set, update } = writable(0)
  
  return {
    subscribe,
    start() {
      setInterval(() => update(n => n + 1), 1000)
    },
    reset() {
      set(0)
    }
  }
}

export const timer = createTimer()
```

## Reactive Statements
```svelte
<script>
  let count = 0
  let numbers = [1, 2, 3]
  
  // Runs when count changes
  $: doubled = count * 2
  
  // Runs when any referenced variable changes
  $: {
    console.log('count changed:', count)
    if (count > 10) {
      console.log('count is large!')
    }
  }
  
  // Reactive object destructuring
  $: ({ a, b } = { a: count, b: count * 2 })
</script>
```

## Event Handling
```svelte
<script>
  function handleClick(event) {
    console.log(event.target)
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      // handle escape
    }
  }
</script>

<button on:click={handleClick}>Click me</button>
<input on:keydown={handleKeydown} />

<!-- Event modifiers -->
<button on:click|once|preventDefault={handleClick}>
  Click once, prevent default
</button>

<!-- Forward events -->
<button on:click>Forwarded</button>
```

## Lifecycle & Context
```svelte
<script>
  import { onMount, onDestroy } from 'svelte'
  import { setContext, getContext } from 'svelte'
  
  onMount(() => {
    console.log('component mounted')
  })
  
  onDestroy(() => {
    console.log('cleanup')
  })
  
  // Context
  setContext('theme', 'dark')
  const theme = getContext('theme')
</script>
```

## SvelteKit
```typescript
// +page.svelte
<script>
  export let data
</script>

{data.message}

// +page.server.ts
export const load = async ({ params }) => {
  return { message: 'Hello' }
}

// +server.ts (API route)
export const POST = async ({ request }) => {
  const data = await request.formData()
  return new Response('ok')
}
```
