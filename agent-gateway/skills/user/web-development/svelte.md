---
name: Svelte
category: web-development
description: A compiler that converts declarative components into efficient JavaScript that surgically updates the DOM
tags:
  - frontend
  - compiler
  - javascript
  - reactive
---

# Svelte

## What I do

I am a radical approach to building user interfaces. Unlike traditional frameworks that do their work in the browser at runtime, I compile your components into highly efficient imperative code that surgically updates the DOM. This means no virtual DOM, no framework overhead, and blazingly fast performance. I was created by Rich Harris and am now maintained by the Svelte community. My reactive system is built into the language itself, making it intuitive and performant.

## When to use me

- Building highly performant applications where bundle size matters
- Creating interactive dashboards and data visualizations
- When you prefer writing less code while achieving more
- Projects where you want excellent performance out of the box
- Building component libraries that need minimal dependencies
- When you enjoy reactive programming without boilerplate
- Prototyping quickly with less cognitive overhead
- Static sites with interactive islands (SvelteKit)

## Core Concepts

- **Compile-Time Compilation**: Svelte components are compiled to vanilla JavaScript at build time
- **Reactive Assignments**: Using = operator to create reactive state
- **Reactive Declarations**: Using $: for computed values and side effects
- **Reactive Statements**: Using $ for automatic subscriptions
- **Stores**: Global state management with writable, readable, and derived stores
- **Props**: Declaring props with export let for component input
- **Slots**: Content projection with named and default slots
- **Transitions and Animations**: Built-in transition engine with svelte/transition
- **SvelteKit**: Full-stack framework built on Svelte for SSR, routing, and more
- **Actions**: Reusable functions that attach to DOM elements

## Code Examples

### Reactive Component

```svelte
<script>
  export let userId;
  
  let user = null;
  let loading = true;
  let error = null;
  
  $: userName = user ? `${user.firstName} ${user.lastName}` : '';
  
  async function fetchUser() {
    loading = true;
    error = null;
    
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      user = await res.json();
    } catch (e) {
      error = e.message;
      user = null;
    } finally {
      loading = false;
    }
  }
  
  $: if (userId) fetchUser();
</script>

<div class="user-profile">
  {#if loading}
    <p class="loading">Loading...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if user}
    <h1>{userName}</h1>
    <p>Email: {user.email}</p>
    <p>Role: {user.role}</p>
    
    <button on:click={fetchUser}>Refresh</button>
    
    <slot name="actions" {user} />
  {/if}
</div>

<style>
  .error {
    color: #dc3545;
  }
  
  .loading {
    color: #6c757d;
  }
</style>
```

### Store for State Management

```javascript
// stores/cart.js
import { writable, derived } from 'svelte/store';

function createCartStore() {
  const { subscribe, set, update } = writable([]);
  
  return {
    subscribe,
    
    addItem(product) {
      update(items => {
        const existing = items.find(i => i.id === product.id);
        if (existing) {
          return items.map(i => 
            i.id === product.id 
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...items, { ...product, quantity: 1 }];
      });
    },
    
    removeItem(productId) {
      update(items => items.filter(i => i.id !== productId));
    },
    
    updateQuantity(productId, quantity) {
      update(items => 
        items.map(i => 
          i.id === productId ? { ...i, quantity } : i
        )
      );
    },
    
    clear() {
      set([]);
    }
  };
}

export const cart = createCartStore();

export const cartCount = derived(cart, $cart => 
  $cart.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartTotal = derived(cart, $cart =>
  $cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
);

// stores/theme.js
import { writable } from 'svelte/store';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme') ?? 'light';
  }
  return 'light';
};

export const theme = writable(getInitialTheme());

theme.subscribe(value => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', value);
    document.documentElement.setAttribute('data-theme', value);
  }
});
```

### Svelte Actions

```javascript
// actions/clickOutside.js
export function clickOutside(node) {
  function handleClick(event) {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent('clickoutside'));
    }
  }
  
  document.addEventListener('click', handleClick, true);
  
  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}

// actions/autofocus.js
export function autofocus(node) {
  node.focus();
  
  return {
    destroy() {
      // Cleanup if needed
    }
  };
}

// actions/draggable.js
export function draggable(node) {
  let x;
  let y;
  
  function handleMousedown(event) {
    x = event.clientX - node.offsetLeft;
    y = event.clientY - node.offsetTop;
    
    document.addEventListener('mousemove', handleMousemove);
    document.addEventListener('mouseup', handleMouseup);
  }
  
  function handleMousemove(event) {
    const left = event.clientX - x;
    const top = event.clientY - y;
    
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
  }
  
  function handleMouseup() {
    document.removeEventListener('mousemove', handleMousemove);
    document.removeEventListener('mouseup', handleMouseup);
  }
  
  node.addEventListener('mousedown', handleMousedown);
  
  return {
    destroy() {
      node.removeEventListener('mousedown', handleMousedown);
    }
  };
}
```

### Component with Transitions

```svelte
<script>
  import { fade, fly, scale } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';
  
  let visible = false;
  let items = [1, 2, 3];
  
  function toggle() {
    visible = !visible;
  }
  
  function remove(id) {
    items = items.filter(i => i !== id);
  }
  
  function add() {
    items = [...items, items.length + 1];
  }
</script>

<div class="demo">
  <button on:click={toggle}>
    {visible ? 'Hide' : 'Show'}
  </button>
  
  <button on:click={add}>Add Item</button>
  
  {#if visible}
    <div 
      class="box" 
      in:fly={{ y: 50, duration: 300 }}
      out:fade
    >
      {#each items as item (item)}
        <div 
          class="item"
          in:scale={{ duration: 300, easing: elasticOut }}
          out:fade
          on:click={() => remove(item)}
        >
          Item {item}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .demo {
    padding: 1rem;
  }
  
  .box {
    margin-top: 1rem;
    padding: 1rem;
    background: #f0f0f0;
    border-radius: 8px;
  }
  
  .item {
    padding: 0.5rem 1rem;
    margin: 0.5rem 0;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
  }
  
  .item:hover {
    background: #fee;
  }
</style>
```

### SvelteKit Page

```svelte
<!-- src/routes/users/[id]/+page.svelte -->
<script>
  import { page } from '$app/stores';
  
  export let data;
</script>

<svelte:head>
  <title>{data.user.name} - My App</title>
</svelte:head>

<div class="user-page">
  <h1>{data.user.name}</h1>
  <p>Email: {data.user.email}</p>
  <a href="/users">Back to Users</a>
</div>
```

```javascript
// src/routes/users/[id]/+page.server.js
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function load({ params }) {
  const user = await db.users.findUnique({
    where: { id: params.id }
  });
  
  if (!user) {
    throw error(404, 'User not found');
  }
  
  return { user };
}

export const actions = {
  update: async ({ request, params }) => {
    const data = await request.formData();
    const name = data.get('name');
    const email = data.get('email');
    
    await db.users.update({
      where: { id: params.id },
      data: { name, email }
    });
    
    return { success: true };
  }
};
```

## Best Practices

- **Reactivity**: Use reactive declarations ($:) for computed values and side effects
- **Derived Stores**: Use derived stores for computed state rather than recalculating in components
- **Keyed Each Blocks**: Always provide a keyed expression in {#each} blocks for proper DOM updates
- **Component Modularity**: Keep components focused and extract reusable logic
- **SvelteKit for Full-Stack**: Use SvelteKit for SSR, routing, and API endpoints
- **Actions for DOM Logic**: Use Svelte actions for reusable DOM manipulation
- **Transition Appropriately**: Use built-in transitions for polish but don't overdo animations
- **Store Patterns**: Use writable stores for mutable state, readable for read-only sources
- **Scoped Styles**: Leverage Svelte's scoped CSS to avoid conflicts
- **Accessibility**: Ensure proper ARIA attributes and keyboard navigation
