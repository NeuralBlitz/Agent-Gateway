---
name: tailwind
description: Tailwind CSS utility-first CSS framework for rapid UI development
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: css-frameworks
---
## What I do
- Build responsive layouts with utility classes
- Create custom designs with arbitrary values
- Use dark mode and custom themes
- Implement animations and transitions
- Build reusable components with @apply
- Optimize production builds with PurgeCSS
- Use CSS variables for theming

## When to use me
When building modern UIs with rapid development speed.

## Layout
```html
<!-- Container -->
<div class="container mx-auto px-4">

<!-- Flexbox -->
<div class="flex flex-row">
  <div class="flex-1">Grow</div>
  <div class="flex-none">No grow</div>
</div>

<!-- Grid -->
<div class="grid grid-cols-3 gap-4">
  <div class="col-span-2">Spans 2</div>
  <div>Auto</div>
</div>

<!-- Responsive -->
<div class="flex flex-col md:flex-row">
  <!-- Stack on mobile, row on medium+ -->
</div>
```

## Spacing & Sizing
```html
<!-- Padding/Margin -->
<div class="p-4 m-2">          <!-- all sides -->
<div class="px-4 py-2">        <!-- x, y axis -->
<div class="pt-4">             <!-- specific side -->
<div class="mt-auto">           <!-- auto margin -->

<!-- Width/Height -->
<div class="w-64 h-32">        <!-- fixed -->
<div class="w-full h-screen">   <!-- full -->
<div class="w-1/2">             <!-- fraction -->
<div class="max-w-lg">          <!-- max width -->
```

## Typography
```html
<!-- Text -->
<p class="text-lg font-bold text-gray-700">
<p class="text-center leading-relaxed">

<!-- Headings -->
<h1 class="text-4xl font-black">
<h2 class="text-2xl font-semibold">

<!-- Custom fonts -->
<div class="font-sans font-serif font-mono">
```

## Colors & States
```html
<!-- Colors -->
<button class="bg-blue-500 text-white">
<button class="bg-red-600 hover:bg-red-700">
<button class="bg-green-500 focus:ring-2">

<!-- Opacity -->
<div class="bg-black bg-opacity-50">

<!-- Dark mode -->
<div class="dark:bg-gray-900">
```

## Components
```html
<!-- Button -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
  Button
</button>

<!-- Card -->
<div class="bg-white rounded-xl shadow-md overflow-hidden">
  <div class="p-6">
    <h3 class="text-lg font-semibold">Card Title</h3>
  </div>
</div>

<!-- Input -->
<input 
  type="text" 
  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
>
```

## Animations
```html
<!-- Transitions -->
<button class="transition duration-300 hover:scale-105">
<div class="transition-all hover:bg-gray-100">

<!-- Keyframes (config) -->
<div class="animate-spin">
<div class="animate-pulse">
<div class="animate-bounce">
```

## Arbitrary Values
```html
<!-- Custom values -->
<div class="top-[calc(100%+1rem)]">
<div class="text-[#1e40af]">
<div class="w-[calc(100%-2rem)]">

<!-- Variants -->
<button class="hover:bg-[#1e40af]">
```
