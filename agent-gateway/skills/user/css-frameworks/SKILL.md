---
name: css-frameworks
description: CSS frameworks for rapid UI development
category: web-development
difficulty: intermediate
tags: [css, styling, responsive, ui]
author: OpenCode Community
version: 1.0
last_updated: 2024-01-15
---

# CSS Frameworks

## What I Do

I am CSS Frameworks, a collection of pre-written CSS providing ready-to-use components, typography, and layout systems for building modern web interfaces. I represent standardized styling approaches including utility-first frameworks like Tailwind CSS and component-based libraries like Bootstrap. I enable developers to create responsive, accessible, and visually consistent user interfaces without writing custom CSS from scratch. I provide reset/normalize styles to ensure cross-browser consistency, grid and flexbox layouts, pre-designed components (buttons, forms, navigation), and responsive design utilities. Modern CSS frameworks offer customization through configuration files, CSS variables for theming, and modular imports to reduce bundle sizes. I help teams maintain design consistency across projects while significantly accelerating development velocity.

## When to Use Me

- Rapid prototyping and MVP development
- Teams needing consistent design systems
- Projects requiring responsive layouts
- Building component libraries
- Landing pages and marketing sites
- Admin dashboards and back-office interfaces
- When design expertise is limited
- Tight project deadlines
- Maintaining brand consistency

## Core Concepts

**Utility Classes**: Small, single-purpose CSS classes (e.g., `flex`, `p-4`, `text-center`) that combine to build designs without custom CSS.

**Component Classes**: Pre-designed UI elements (buttons, cards, modals) with consistent styling and behavior.

**Responsive Breakpoints**: Predefined viewport width thresholds for adaptive layouts (mobile, tablet, desktop).

**Grid Systems**: Column-based layout structures for organizing content systematically.

**CSS Custom Properties**: CSS variables for theming, dark mode, and dynamic styling.

**Prefixing Conventions**: BEM, utility prefixes, or component namespaces to prevent style collisions.

**Reset/Normalize**: Browser consistency styles removing default margins, padding, and inconsistencies.

## Code Examples

### Example 1: Tailwind CSS Utility Classes
```html
<!-- Tailwind CSS - Responsive Card Component -->
<div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="md:flex">
        <div class="md:flex-shrink-0">
          <img class="h-48 w-full object-cover md:w-48" 
               src="/api/placeholder/400/400" 
               alt="Product image">
        </div>
        <div class="p-8">
          <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Product
          </div>
          <h3 class="block mt-1 text-lg leading-tight font-medium text-black">
            Premium Wireless Headphones
          </h3>
          <p class="mt-2 text-gray-500">
            Experience crystal-clear audio with our latest noise-canceling technology.
          </p>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-2xl font-bold text-gray-900">$299</span>
            <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Responsive Grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
  <div class="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <h3 class="text-xl font-bold mb-2">Card 1</h3>
    <p class="text-gray-600">Responsive grid item</p>
  </div>
  <!-- More cards... -->
</div>
```

### Example 2: Bootstrap 5 Component Library
```html
<!-- Bootstrap 5 - Responsive Navigation -->
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container">
    <a class="navbar-brand" href="#">
      <i class="bi bi-cpu me-2"></i>TechApp
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
            data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link active" href="#">Home</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" 
             data-bs-toggle="dropdown">Products</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#">Software</a></li>
            <li><a class="dropdown-item" href="#">Hardware</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#">Services</a></li>
          </ul>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">Pricing</a>
        </li>
      </ul>
      <form class="d-flex">
        <input class="form-control me-2" type="search" placeholder="Search">
        <button class="btn btn-outline-light" type="submit">Search</button>
      </form>
    </div>
  </div>
</nav>

<!-- Bootstrap Cards Grid -->
<div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
  <div class="col">
    <div class="card h-100 border-0 shadow-sm">
      <img src="/api/placeholder/300/200" class="card-img-top" alt="...">
      <div class="card-body">
        <h5 class="card-title">Card Title</h5>
        <p class="card-text">Content here</p>
        <button class="btn btn-primary btn-sm">Learn More</button>
      </div>
    </div>
  </div>
</div>

<!-- Bootstrap Modal -->
<div class="modal fade" id="exampleModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Confirm Action</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to proceed?</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

### Example 3: CSS Custom Properties with Theming
```css
/* Design Tokens - design-tokens.css */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #60a5fa;
  --color-secondary: #10b981;
  --color-accent: #f59e0b;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-success: #10b981;
  
  /* Typography */
  --font-family-base: 'Inter', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* Dark Mode Support */
[data-theme="dark"] {
  --color-bg-primary: #1f2937;
  --color-bg-secondary: #374151;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --color-primary: #0000ff;
    --color-bg-primary: #ffffff;
    --color-text-primary: #000000;
  }
}
```

### Example 4: CSS Grid Layout System
```css
/* Grid Layout System - grid.css */
.grid-container {
  display: grid;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  
  /* Responsive grid columns */
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-auto-rows: minmax(200px, auto);
}

.grid-dashboard {
  display: grid;
  gap: var(--spacing-4);
  grid-template-areas:
    "header header"
    "sidebar main"
    "sidebar stats";
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .grid-dashboard {
    grid-template-areas:
      "header"
      "sidebar"
      "main"
      "stats";
    grid-template-columns: 1fr;
  }
}

.dashboard-header { grid-area: header; }
.dashboard-sidebar { grid-area: sidebar; }
.dashboard-main { grid-area: main; }
.dashboard-stats { grid-area: stats; }

/* Card Component */
.card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
}

.card-body {
  flex: 1;
}

.card-footer {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}
```

### Example 5: Flexbox Component Utilities
```css
/* Flex Utilities - flex.css */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.justify-evenly { justify-content: space-evenly; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-baseline { align-items: baseline; }
.items-stretch { align-items: stretch; }

.gap-1 { gap: var(--spacing-1); }
.gap-2 { gap: var(--spacing-2); }
.gap-3 { gap: var(--spacing-3); }
.gap-4 { gap: var(--spacing-4); }
.gap-6 { gap: var(--spacing-6); }
.gap-8 { gap: var(--spacing-8); }

.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-initial { flex: 0 1 auto; }
.flex-none { flex: none; }

.grow { flex-grow: 1; }
.grow-0 { flex-grow: 0; }
.shrink { flex-shrink: 1; }
.shrink-0 { flex-shrink: 0; }

/* Common Layout Patterns */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-6);
}

.center-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.split-view {
  display: flex;
  height: 100%;
}

.split-view > :first-child {
  width: 300px;
  flex-shrink: 0;
}

.split-view > :last-child {
  flex: 1;
  overflow: auto;
}
```

## Best Practices

- Use CSS custom properties for theming and dynamic styling
- Leverage CSS Grid for complex 2D layouts, Flexbox for 1D layouts
- Implement mobile-first responsive design
- Use semantic HTML with ARIA attributes for accessibility
- Minimize custom CSS by maximizing framework utilities
- Customize frameworks through configuration rather than overrides
- Use CSS modules or scoped styles to prevent conflicts
- Implement proper responsive breakpoints
- Use CSS containment for rendering performance
- Test across multiple browsers and devices

## Core Competencies

- Utility-first CSS frameworks (Tailwind CSS)
- Component-based frameworks (Bootstrap, Bulma)
- CSS Grid layout systems
- Flexbox component patterns
- CSS custom properties and theming
- Responsive design breakpoints
- Design token architecture
- Component accessibility (ARIA)
- CSS animation and transitions
- Performance optimization techniques
- Cross-browser compatibility
- Dark mode and theme switching
