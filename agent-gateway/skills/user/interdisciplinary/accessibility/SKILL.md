---
name: Accessibility
description: Designing and building products that can be used by people with diverse abilities, including those with visual, auditory, motor, and cognitive impairments
license: MIT
compatibility: universal
audience: developers, designers, content creators
category: interdisciplinary
---

# Accessibility

## What I Do

I ensure digital products are usable by people with diverse abilities through standards-compliant implementation. I help identify and remove barriers that prevent equal access to information and functionality.

## When to Use Me

- Building new features or components
- Auditing existing applications for accessibility
- Creating accessible forms, navigation, and content
- Ensuring screen reader compatibility
- Meeting legal compliance requirements (ADA, WCAG, Section 508)
- Testing with assistive technologies

## Core Concepts

1. **WCAG Principles**: Perceivable, Operable, Understandable, Robust (POUR)
2. **Accessibility Tree**: DOM representation for assistive technologies
3. **ARIA Roles and Attributes**: Accessible Rich Internet Applications semantics
4. **Screen Reader Navigation**: How blind users traverse content
5. **Keyboard Accessibility**: All functionality via keyboard alone
6. **Color Contrast**: Minimum ratios for readability (4.5:1 normal, 3:1 large)
7. **Focus Management**: Visible, logical, and ordered focus indicators
8. **Reduced Motion**: Respecting user motion preferences
9. **Alternative Text**: Text equivalents for non-text content
10. **Captions and Transcripts**: Audio and video accessibility

## Code Examples

### Accessible Form with Error Handling
```jsx
import React, { useState } from 'react';

const AccessibleForm = () => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (name, value) => {
    switch (name) {
      case 'email':
        return !value.includes('@') ? 'Please enter a valid email' : '';
      case 'password':
        return value.length < 8 ? 'Password must be at least 8 characters' : '';
      default:
        return '';
    }
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validate(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  return (
    <form aria-describedby="form-instructions">
      <p id="form-instructions" className="sr-only">
        All fields are required. We'll use your email to send confirmation.
      </p>
      
      <div role="group" aria-labelledby="email-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          aria-required="true"
          aria-invalid={!!(touched.email && errors.email)}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
          onBlur={handleBlur}
        />
        <span id="email-hint" className="hint">We'll never share your email</span>
        {errors.email && (
          <span id="email-error" role="alert" className="error">
            {errors.email}
          </span>
        )}
      </div>
      
      <button type="submit" aria-disabled={Object.values(errors).some(Boolean)}>
        Submit
      </button>
    </form>
  );
};
```

### Screen Reader Announcement Manager
```javascript
class Announcer {
  constructor() {
    this.announcement = '';
    this.liveRegion = null;
    this.init();
  }
  
  init() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    document.body.appendChild(this.liveRegion);
  }
  
  announce(message, priority = 'polite') {
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = '';
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 100);
  }
  
  announceError(message) {
    this.announce(message, 'assertive');
  }
}

// Usage for dynamic content updates
const announcer = new Announcer();

function showNotification(message) {
  announcer.announce(message);
}

function showError(error) {
  announcer.announceError(error);
}
```

### Keyboard Navigation Handler
```javascript
class KeyboardNavigator {
  constructor(container) {
    this.container = container;
    this.items = [];
    this.currentIndex = 0;
  }
  
  setupGridNavigation(columns) {
    this.columns = columns;
    
    this.container.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
          this.moveFocus(1);
          break;
        case 'ArrowLeft':
          this.moveFocus(-1);
          break;
        case 'ArrowDown':
          this.moveFocus(this.columns);
          break;
        case 'ArrowUp':
          this.moveFocus(-this.columns);
          break;
        case 'Home':
          this.moveTo(0);
          break;
        case 'End':
          this.moveTo(this.items.length - 1);
          break;
        case 'Enter':
        case ' ':
          this.activateCurrent();
          e.preventDefault();
          break;
        default:
          return;
      }
      e.preventDefault();
    });
  }
  
  moveFocus(direction) {
    let newIndex = this.currentIndex + direction;
    newIndex = Math.max(0, Math.min(newIndex, this.items.length - 1));
    this.moveTo(newIndex);
  }
  
  moveTo(index) {
    this.currentIndex = index;
    this.items[index]?.focus();
  }
  
  activateCurrent() {
    this.items[this.currentIndex]?.click();
  }
}
```

## Best Practices

1. Test with real assistive technologies (NVDA, VoiceOver, switch controls)
2. Use semantic HTML elements whenever possible
3. Ensure all interactive elements are keyboard accessible
4. Provide text alternatives for all non-text content
5. Maintain sufficient color contrast ratios
6. Never rely on color alone to convey information
7. Design for focus visibility and logical tab order
8. Use ARIA only when necessary and correctly
9. Provide captions and transcripts for multimedia
10. Test with users who have disabilities throughout development
