---
name: internationalization
description: Internationalization (i18n) best practices and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: frontend
---
## What I do
- Implement i18n in applications
- Handle locale detection and switching
- Format dates, numbers, and currencies
- Manage translation files
- Handle plurals and gender
- Support RTL languages
- Test translations
- Design for localization

## When to use me
When implementing internationalization or localization.

## i18n Architecture
```
i18n/
├── en/
│   └── messages.json
├── es/
│   └── messages.json
├── zh/
│   └── messages.json
├── ar/
│   └── messages.json  # RTL language
└── i18n.ts           # i18n utilities
```

## Translation Files
```json
// en/messages.json
{
  "app": {
    "title": "My Application",
    "tagline": "Building the future"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit",
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Operation successful"
  },
  "user": {
    "welcome": "Welcome, {{name}}!",
    "profile": "User Profile",
    "settings": "Settings",
    "logout": "Log Out"
  },
  "date": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow"
  },
  "errors": {
    "required": "{{field}} is required",
    "email": "Please enter a valid email address",
    "min_length": "{{field}} must be at least {{min}} characters",
    "max_length": "{{field}} must be no more than {{max}} characters"
  }
}

// es/messages.json
{
  "app": {
    "title": "Mi Aplicación",
    "tagline": "Construyendo el futuro"
  },
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "submit": "Enviar",
    "loading": "Cargando...",
    "error": "Ocurrió un error",
    "success": "Operación exitosa"
  },
  "user": {
    "welcome": "¡Bienvenido, {{name}}!"
  }
}
```

## i18n Implementation
```typescript
// i18n.ts
import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';


i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    supportedLngs: ['en', 'es', 'zh', 'ar', 'fr', 'de'],
    fallbackLng: 'en',
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
    
    interpolation: {
      escapeValue: false,  // React already safes from XSS
    },
    
    react: {
      useSuspense: false,
    },
  });


export default i18next;


// Component usage
import { useTranslation } from 'react-i18next';


function UserWelcome({ name }: { name: string }) {
  const { t, i18n } = useTranslation();
  
  return (
    <p>{t('user.welcome', { name })}</p>
  );
}


// Changing language
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="zh">中文</option>
      <option value="ar">العربية</option>
    </select>
  );
}
```

## Pluralization
```json
// messages.json with plurals
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items",
  "items_zero": "No items",
  
  "notifications_one": "You have {{count}} notification",
  "notifications_other": "You have {{count}} notifications",
  
  "messages_one": "{{count}} message",
  "messages_other": "{{count}} messages"
}
```

```typescript
// Using plurals
function ItemCount({ count }: { count: number }) {
  const { t } = useTranslation();
  
  return (
    <span>
      {t('items', { count, defaultValue: '{{count}} items' })}
    </span>
  );
}


// Complex plural rules
// CLDR plural rules handle edge cases
// Arabic has 6 forms: zero, one, two, few, many, other
```

## Formatting
```typescript
import { format } from 'i18next';


// Date formatting
const date = new Date('2024-01-15');

format(date, 'EEEE, MMMM d, yyyy', { lng: 'en' });
// "Monday, January 15, 2024"

format(date, 'EEEE, MMMM d, yyyy', { lng: 'es' });
// "lunes, 15 de enero de 2024"

format(date, 'yyyy/MM/dd', { lng: 'zh' });
// "2024/01/15"


// Number formatting
const number = 1234567.89;

format(number, 'currency', { lng: 'en', currency: 'USD' });
// "$1,234,567.89"

format(number, 'currency', { lng: 'de', currency: 'EUR' });
// "1.234.567,89 €"


// Relative time
format(date, 'relativeTime', { lng: 'en', addSuffix: true });
// "2 days ago"

format(date, 'relativeTime', { lng: 'zh', addSuffix: true });
// "2天前"
```

## RTL Support
```css
/* RTL (Right-to-Left) Support */

/* Base styles */
.content {
  padding-left: 16px;
  padding-right: 16px;
  margin-left: auto;
  margin-right: 0;
  text-align: left;
  border-left: 2px solid blue;
  border-right: none;
}

/* RTL override */
[dir="rtl"] .content {
  padding-left: 16px;
  padding-right: 16px;
  margin-left: 0;
  margin-right: auto;
  text-align: right;
  border-left: none;
  border-right: 2px solid blue;
}


/* Use logical properties */
.element {
  padding-inline-start: 16px;
  padding-inline-end: 16px;
  margin-inline-start: auto;
  margin-inline-end: 0;
  border-inline-start: 2px solid blue;
  border-inline-end: none;
}


/* Bidirectional text */
.bidi-text {
  direction: ltr;
  unicode-bidi: isolate;
}
```

## Testing i18n
```typescript
import i18next from 'i18n';


describe('Internationalization', () => {
  beforeEach(() => {
    i18next.changeLanguage('en');
  });
  
  it('translates common actions', () => {
    expect(i18next.t('common.save')).toBe('Save');
    expect(i18next.t('common.cancel')).toBe('Cancel');
  });
  
  it('handles plurals', () => {
    expect(i18next.t('items', { count: 1 })).toBe('1 item');
    expect(i18next.t('items', { count: 5 })).toBe('5 items');
  });
  
  it('handles interpolation', () => {
    expect(i18next.t('user.welcome', { name: 'John' }))
      .toBe('Welcome, John!');
  });
  
  it('switches language', () => {
    i18next.changeLanguage('es');
    expect(i18next.t('common.save')).toBe('Guardar');
  });
  
  it('handles missing translations', () => {
    expect(i18next.t('missing.key')).toBe('missing.key');
  });
});
```

## Best Practices
```
1. Keys should be semantic, not literal
   BAD: "save_button_text"
   GOOD: "common.save"

2. Never concatenate strings
   BAD: "Hello " + name + ", you have " + count + " messages"
   GOOD: "user.welcome" with interpolation

3. Use namespaces for organization
   common, user, validation, errors, etc.

4. Design for variable content
   Account for text expansion (German +30%)

5. Consider date/time formats
   Different regions use different formats

6. Handle currency and numbers
   Different decimal separators, thousands separators

7. Test with real content
   Not just Lorem Ipsum

8. Use professional translation services
   Don't rely on automated translation for production
```
