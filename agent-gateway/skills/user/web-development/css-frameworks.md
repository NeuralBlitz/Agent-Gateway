---
name: css-frameworks
description: CSS frameworks for rapid UI development
category: web-development
---

# CSS Frameworks

## What I Do

CSS frameworks provide pre-written CSS classes, components, and design systems that accelerate UI development. I offer ready-to-use styling solutions that handle layout, typography, forms, and responsive design. Frameworks like Tailwind CSS, Bootstrap, and Foundation provide utility classes, pre-built components, and design tokens that ensure consistency across applications.

I enable rapid prototyping and consistent design systems. Utility-first frameworks like Tailwind allow composing designs directly in HTML. Component frameworks like Bootstrap provide ready-made UI elements. Design system frameworks establish tokens and guidelines for maintaining visual consistency at scale.

## When to Use Me

Choose CSS frameworks for rapid development, especially in teams with varying CSS expertise. Use utility frameworks for custom designs requiring flexibility. Use component frameworks for standard UI patterns. Use design systems for large applications requiring consistency. Avoid frameworks when designs are highly custom and frameworks add unnecessary weight, or when learning CSS fundamentals is more important than development speed.

## Core Concepts

Grid systems create flexible layouts using rows and columns. Flexbox utilities handle one-dimensional layouts. Utility classes apply single CSS properties. Component classes compose multiple styles. Design tokens define colors, spacing, typography, and other design decisions. Responsive modifiers adapt styles at breakpoints.

Preprocessors like Sass extend CSS with variables, nesting, and mixins. PostCSS processes CSS through plugins. Critical CSS extracts above-the-fold styles for performance. CSS-in-JS embeds styles in JavaScript for component-scoped styling. CSS modules scope styles to components automatically.

## Code Examples

```html
<!-- Tailwind CSS utility classes -->
<div class="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Dashboard
      </h1>
      <p class="text-gray-600">
        Welcome back, John
      </p>
    </header>
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-full">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">
              </path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500">Users</p>
            <p class="text-2xl font-semibold text-gray-900">1,234</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-full">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z">
              </path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500">Revenue</p>
            <p class="text-2xl font-semibold text-gray-900">$45,678</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-full">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z">
              </path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500">Conversion</p>
            <p class="text-2xl font-semibold text-gray-900">3.24%</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Responsive Navigation -->
    <nav class="bg-white shadow rounded-lg mb-8">
      <div class="px-4 py-4 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-xl font-bold text-gray-900">Brand</span>
          </div>
          <div class="hidden md:flex space-x-4">
            <a href="#" class="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-900">
              Dashboard
            </a>
            <a href="#" class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50">
              Reports
            </a>
            <a href="#" class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50">
              Settings
            </a>
          </div>
          <button class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </nav>
    
    <!-- Form -->
    <form class="bg-white shadow rounded-lg p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input 
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="John"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input 
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Doe"
          />
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <button 
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button 
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </form>
  </div>
</div>
```

```css
/* Custom CSS with design tokens (CSS custom properties) */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #60a5fa;
  --color-secondary: #6366f1;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-600: #4b5563;
  --color-gray-900: #111827;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  
  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, monospace;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;
}

/* Utility classes */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.grid {
  display: grid;
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }

@media (min-width: 640px) {
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 768px) {
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.gap-4 { gap: var(--spacing-4); }
.gap-6 { gap: var(--spacing-6); }

.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }

.p-4 { padding: var(--spacing-4); }
.p-6 { padding: var(--spacing-6); }
.px-4 { padding-left: var(--spacing-4); padding-right: var(--spacing-4); }
.py-2 { padding-top: var(--spacing-2); padding-bottom: var(--spacing-2); }

.mb-4 { margin-bottom: var(--spacing-4); }
.mb-6 { margin-bottom: var(--spacing-6); }
.mt-4 { margin-top: var(--spacing-4); }

.bg-white { background-color: white; }
.bg-gray-100 { background-color: var(--color-gray-100); }

.text-gray-600 { color: var(--color-gray-600); }
.text-gray-900 { color: var(--color-gray-900); }

.rounded { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-full { border-radius: var(--radius-full); }

.shadow { box-shadow: var(--shadow); }
.shadow-lg { box-shadow: var(--shadow-lg); }

.font-bold { font-weight: 700; }
.text-sm { font-size: var(--text-sm); }
.text-xl { font-size: var(--text-xl); }
.text-2xl { font-size: var(--text-2xl); }

.hover\:bg-gray-50:hover { background-color: var(--color-gray-50); }
.focus\:ring:focus { box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color-primary); }
```

```scss
/* Bootstrap-inspired component styles */
@use 'sass:color';

// Variables
$primary: #0d6efd;
$secondary: #6c757d;
$success: #198754;
$danger: #dc3545;
$warning: #ffc107;
$info: #0dcaf0;
$light: #f8f9fa;
$dark: #212529;

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  border: 1px solid transparent;
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

.btn-primary {
  color: white;
  background-color: $primary;
  border-color: $primary;
  
  &:hover:not(:disabled) {
    background-color: color.adjust($primary, $lightness: -7.5%);
    border-color: color.adjust($primary, $lightness: -10%);
  }
  
  &:focus {
    box-shadow: 0 0 0 0.25rem rgba($primary, 0.5);
  }
}

.btn-secondary {
  color: white;
  background-color: $secondary;
  border-color: $secondary;
  
  &:hover:not(:disabled) {
    background-color: color.adjust($secondary, $lightness: -7.5%);
    border-color: color.adjust($secondary, $lightness: -10%);
  }
}

.btn-success {
  color: white;
  background-color: $success;
  border-color: $success;
}

.btn-danger {
  color: white;
  background-color: $danger;
  border-color: $danger;
}

.btn-outline-primary {
  color: $primary;
  background-color: transparent;
  border-color: $primary;
  
  &:hover:not(:disabled) {
    color: white;
    background-color: $primary;
  }
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 0.5rem 1rem;
  font-size: 1.25rem;
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: white;
  background-clip: border-box;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 1rem;
  margin-bottom: 0;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  
  &:first-child {
    border-radius: calc(0.5rem - 1px) calc(0.5rem - 1px) 0 0;
  }
}

.card-body {
  flex: 1 1 auto;
  padding: 1rem;
}

.card-footer {
  padding: 0.75rem 1rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-top: 1px solid rgba(0, 0, 0, 0.125);
}
```

## Best Practices

Use utility classes for small, reusable styles and component classes for complex patterns. Establish design tokens for consistency across the codebase. Implement responsive design using mobile-first approaches. Purge unused CSS in production to minimize file size.

Use CSS custom properties for theming and dynamic styles. Maintain a style guide or design system documentation. Keep specificity low to avoid override battles. Use a class naming convention like BEM for custom CSS. Test responsive behavior across devices.

## Common Patterns

The utility-first pattern composes styles directly in HTML using utility classes. The component pattern creates reusable UI components with scoped styles. The design system pattern establishes tokens and guidelines for consistency. The responsive design pattern adapts layouts across breakpoints.

The theming pattern uses CSS variables for dynamic styling. The micro-component pattern creates small, composable UI pieces. The atomic design pattern organizes components into atoms, molecules, organisms, templates, and pages. The CSS-in-JS pattern co-locates styles with components for better developer experience.
