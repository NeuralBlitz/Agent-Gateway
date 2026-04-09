---
name: accessibility
description: Web accessibility (a11y) best practices and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: frontend
---
## What I do
- Implement WCAG guidelines
- Create accessible HTML structure
- Handle keyboard navigation
- Implement ARIA attributes
- Ensure proper color contrast
- Support screen readers
- Design for various disabilities
- Test accessibility

## When to use me
When creating accessible user interfaces or reviewing for accessibility.

## WCAG Guidelines Summary
```
WCAG 2.1 Principles:
1. Perceivable
   - Text alternatives for images
   - Captions for audio
   - Adaptable layouts
   - Distinguishable (color, contrast)

2. Operable
   - Keyboard accessible
   - Enough time for interactions
   - No seizure-inducing content
   - Navigable (headings, focus order)

3. Understandable
   - Readable and predictable
   - Input assistance

4. Robust
   - Compatible with current and future user agents

Conformance Levels:
- A: Minimum (required)
- AA: Recommended (target)
- AAA: Highest (exceptional cases)
```

## Semantic HTML
```html
<!-- BAD: Non-semantic markup -->
<div class="header">
  <div class="logo"></div>
  <div class="nav"></div>
</div>
<div class="main">
  <div class="article">Content</div>
</div>
<div class="footer"></div>

<!-- GOOD: Semantic HTML -->
<header>
  <a href="/" aria-label="Homepage">
    <img src="logo.png" alt="Company Name">
  </a>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/products">Products</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h1>Page Title</h1>
    <p>Main content goes here...</p>
  </article>
</main>
<footer>
  <p>&copy; 2024 Company</p>
</footer>
```

## Keyboard Navigation
```html
<!-- BAD: Non-interactive elements -->
<div class="button" onclick="save()">Save</div>

<!-- GOOD: Proper interactive elements -->
<button type="button" onclick="save()">Save</button>


<!-- Skip link for keyboard users -->
<head>
  <style>
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 100;
    }
    
    .skip-link:focus {
      top: 0;
    }
  </style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <nav>...</nav>
  <main id="main-content">
    <h1>Main Content</h1>
  </main>
</body>


<!-- Focus management -->
<button
  type="button"
  onclick="openModal()"
  aria-haspopup="dialog"
  aria-expanded="false"
>
  Open Modal
</button>

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  hidden
>
  <h2 id="modal-title">Modal Title</h2>
  <button
    type="button"
    onclick="closeModal()"
    aria-label="Close modal"
  >
    ×
  </button>
  <div>Modal content...</div>
</div>
```

## ARIA Attributes
```html
<!-- ARIA roles for custom components -->
<div role="button" tabindex="0" aria-pressed="false">
  Toggle Favorite
</div>

<!-- Live regions for dynamic content -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Changes will be announced
</div>

<!-- Form validation -->
<form>
  <label for="email">Email</label>
  <input
    type="email"
    id="email"
    name="email"
    aria-describedby="email-hint email-error"
    aria-invalid="false"
  >
  <p id="email-hint">We'll never share your email</p>
  <p id="email-error" hidden>
    Please enter a valid email address
  </p>
</form>
```

## Color Contrast
```css
/* Minimum contrast ratios (WCAG AA) */
/* Normal text: 4.5:1 */
/* Large text (18pt+ or 14pt bold): 3:1 */
/* UI components: 3:1 */

.good-contrast {
  /* Passes AAA (7:1) */
  color: #1a1a1a;
  background-color: #ffffff;
}

.acceptable-contrast {
  /* Passes AA (4.5:1) */
  color: #333333;
  background-color: #ffffff;
}

.large-text {
  /* Passes AA for large text (3:1) */
  color: #555555;
  background-color: #ffffff;
  font-size: 18px;
}

/* Don't rely on color alone */
.status {
  padding: 4px 8px;
  border-radius: 4px;
}

.status.success {
  background-color: #d4edda;
  color: #155724;
}

.status.error {
  background-color: #f8d7da;
  color: #721c24;
}

/* Add icon to reinforce color meaning */
.status.success::before {
  content: "✓ ";
}

.status.error::before {
  content: "✕ ";
}
```

## Screen Reader Support
```html
<!-- Images must have alt text -->
<img src="chart.png" alt="Sales chart showing 25% growth in Q4">

<!-- Decorative images -->
<img src="decoration.png" alt="" role="presentation">

<!-- Complex images need detailed descriptions -->
<img
  src="infographic.png"
  alt="Infographic: Step 1 Research, Step 2 Design, Step 3 Development"
>
<details>
  <summary>View detailed description</summary>
  <p>Full description of the infographic content...</p>
</details>


<!-- Tables need proper structure -->
<table>
  <caption>Quarterly Sales Report</caption>
  <thead>
    <tr>
      <th scope="col">Quarter</th>
      <th scope="col">Revenue</th>
      <th scope="col">Expenses</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Q1</th>
      <td>$100,000</td>
      <td>$80,000</td>
    </tr>
  </tbody>
</table>
```

## Form Accessibility
```html
<form>
  <fieldset>
    <legend>Contact Information</legend>
    
    <div class="form-group">
      <label for="name">Full Name <span aria-hidden="true">*</span></label>
      <input
        type="text"
        id="name"
        name="name"
        required
        aria-required="true"
        autocomplete="name"
      >
    </div>
    
    <div class="form-group">
      <label for="email">Email Address</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        aria-required="true"
        autocomplete="email"
      >
    </div>
    
    <div class="form-group">
      <label for="phone">Phone Number</label>
      <input
        type="tel"
        id="phone"
        name="phone"
        autocomplete="tel"
        pattern="[0-9+\-\(\) ]*"
        aria-describedby="phone-hint"
      >
      <p id="phone-hint">Include country code (e.g., +1)</p>
    </div>
  </fieldset>
  
  <button type="submit">Submit</button>
</form>


<!-- Error handling -->
<form>
  <div class="form-group has-error">
    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      aria-invalid="true"
      aria-describedby="email-error"
    >
    <p id="email-error" role="alert">
      Please enter a valid email address
    </p>
  </div>
</form>
```

## Testing Accessibility
```python
# Automated accessibility testing with axe-core
import pytest


class TestAccessibility:
    def test_homepage_accessibility(self, page):
        """Test homepage with axe-core."""
        page.goto('/')
        
        # Run axe-core
        violations = page.evaluate('''() => {
          const axe = window.axe;
          return axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa']
            }
          });
        }''')
        
        assert len(violations['violations']) == 0, \
            f"Accessibility violations: {violations['violations']}"
    
    def test_keyboard_navigation(self, page):
        """Test keyboard navigation works."""
        page.goto('/')
        
        # Press Tab multiple times
        page.keyboard.press('Tab')
        focused = page.evaluate('document.activeElement.tagName')
        
        # First focusable element should be first link
        assert focused in ['A', 'BUTTON', 'INPUT']
    
    def test_color_contrast(self, page):
        """Test color contrast requirements."""
        page.goto('/')
        
        violations = page.evaluate('''() => {
          const axe = window.axe;
          const results = axe.run(document, {
            checks: ['color-contrast']
          });
          return results.violations;
        }''')
        
        assert len(violations) == 0


# Manual testing checklist
ACCESSIBILITY_CHECKLIST = """
[] All images have alt text
[] Form inputs have associated labels
[] Headings follow proper hierarchy (h1 > h2 > h3)
[] Color is not the only means of conveying information
[] Focus order is logical
[] Keyboard navigation works throughout
[] Skip links are present
[] ARIA landmarks are used correctly
[] Form errors are announced
[] Error messages are specific
[] Page has language attribute
[] Content is readable at 200% zoom
[] No keyboard traps
[] Focus is not lost when modal closes
"""
```
