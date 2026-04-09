---
name: vue
description: Vue.js progressive JavaScript framework for building user interfaces
category: web-development
---

# Vue.js

## What I Do

Vue.js is a progressive JavaScript framework for building user interfaces, created by Evan You. I combine the best ideas from React and Angular while remaining approachable and flexible. My core library focuses on the view layer only, making me easy to learn and integrate with other libraries. I provide a reactive data-binding system and component-based architecture that makes building complex applications intuitive.

I excel at building single-page applications, interactive dashboards, and progressive web applications. My single-file components encapsulate template, logic, and styles in one file, promoting organized code. Vue Router handles client-side routing, and Pinia provides state management. My gentle learning curve makes me popular for teams transitioning from jQuery or vanilla JavaScript.

## When to Use Me

Choose Vue when you want a flexible framework that scales from simple enhancements to full single-page applications. I work well for teams that prefer a more structured approach than React provides while avoiding Angular's complexity. Vue is ideal for applications requiring rapid development, clear documentation, and a supportive ecosystem. Avoid Vue for extremely performance-critical applications where bundle size is paramount, or when your team is heavily invested in the React ecosystem.

## Core Concepts

Vue applications are built using reactive data objects that automatically update the DOM when their properties change. Components are defined using options objects or composition API functions, with templates using HTML-based syntax that feels familiar to developers. Vue's reactivity system tracks dependencies during rendering, only updating affected components when data changes. The composition API, introduced in Vue 3, provides better logic reuse and type inference than the options API.

Vue Router handles navigation with dynamic routing, nested routes, and navigation guards. Pinia provides a lightweight state management solution with a simple API. Vue's transition system animates elements entering and leaving the DOM. The ecosystem includes Nuxt for server-side rendering, Vite for fast tooling, and VueUse for composition utilities.

## Code Examples

```vue
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['select', 'error']);

const user = ref(null);
const loading = ref(true);
const error = ref(null);
const router = useRouter();
const route = useRoute();

const userInitials = computed(() => {
  if (!user.value?.name) return '';
  return user.value.name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
});

const loadUser = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(`/api/users/${props.userId}`);
    if (!response.ok) throw new Error('User not found');
    user.value = await response.json();
    emit('select', user.value);
  } catch (err) {
    error.value = err.message;
    emit('error', err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadUser);

watch(() => props.userId, loadUser);
</script>

<template>
  <div class="user-profile" :class="{ loading }">
    <div v-if="loading" class="spinner">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content">
      <div class="avatar">{{ userInitials }}</div>
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
      <button @click="router.back()">Back</button>
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  padding: 1rem;
  border-radius: 8px;
}

.user-profile.loading {
  opacity: 0.6;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
```

```vue
<script setup>
import { ref, provide, inject } from 'vue';

const theme = ref('light');

const ThemeSymbol = Symbol('Theme');

provide(ThemeSymbol, {
  theme,
  toggleTheme: () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }
});
</script>

<script>
export default {
  name: 'UserList',
  props: {
    users: {
      type: Array,
      required: true
    }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const selectedId = ref(null);
    
    const selectUser = (user) => {
      selectedId.value = user.id;
      emit('select', user);
    };
    
    return { selectedId, selectUser };
  }
}
</script>

<template>
  <ul class="user-list">
    <li 
      v-for="user in users" 
      :key="user.id"
      :class="{ selected: selectedId === user.id }"
      @click="selectUser(user)"
    >
      {{ user.name }}
    </li>
  </ul>
</template>

<style scoped>
.user-list {
  list-style: none;
  padding: 0;
}

.user-list li {
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.user-list li:hover {
  background: #f5f5f5;
}

.user-list li.selected {
  background: #e3f2fd;
}
</style>
```

## Best Practices

Use the composition API with script setup for better TypeScript support and cleaner code. Organize single-file components with template first, then script, then styles. Use props for parent-to-child communication and events for child-to-parent communication. Implement proper key attributes in v-for loops for optimal rendering. Use computed properties for derived state instead of methods to benefit from caching.

Avoid mutating props directly, instead emit events to let the parent handle changes. Use shallowRef for objects that shouldn't be deeply reactive. Implement proper cleanup in onUnmounted hooks for subscriptions and timers. Use async components with Suspense for code splitting and lazy loading. Write tests with Vue Test Utils and Vitest for component testing.

## Common Patterns

The composable pattern extracts reusable logic into functions using Vue's composition API, enabling cross-component code sharing. The provide/inject pattern passes data through the component tree without prop drilling, useful for theme context and feature flags. The slot pattern creates flexible component APIs by allowing parents to inject content into child components.

The dynamic component pattern uses component is attribute to switch between components at runtime. The render function pattern creates flexible rendering logic when template syntax is insufficient. The teleported component pattern uses the Teleport component to render content in different DOM locations, useful for modals and tooltips.
