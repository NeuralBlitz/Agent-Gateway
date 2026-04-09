---
name: Internationalization
description: Designing and building software that can be adapted to various languages, regions, and cultures without engineering changes
license: MIT
compatibility: universal
audience: developers, designers, product managers
category: interdisciplinary
---

# Internationalization

## What I Do

I prepare applications for global audiences by designing systems that support multiple languages, date/time formats, number formats, and cultural conventions. I separate locale-specific content from code to enable efficient localization.

## When to Use Me

- Preparing applications for international markets
- Implementing multiple language support
- Handling locale-specific formatting (dates, numbers, currencies)
- Managing right-to-left (RTL) language layouts
- Creating translation workflows and management systems
- Adapting content for cultural preferences

## Core Concepts

1. **Locale Identification**: Language tags (en-US, zh-Hans, ar-EG)
2. **Message Formatting**: ICU MessageFormat with plurals, gender, select
3. **Date/Time Formatting**: Locale-aware date and time display
4. **Number Formatting**: Locale-specific decimal/thousand separators
5. **Pluralization Rules**: Language-specific plural categories
6. **Text Expansion**: Languages that require more space than English
7. **RTL Support**: Right-to-left layout for Arabic, Hebrew, Persian
8. **Cultural Adaptations**: Date formats, currencies, address formats
9. **Translation Management**: Workflows for handling translations
10. **Pseudo-localization**: Testing for i18n before actual translations

## Code Examples

### Internationalization Provider
```javascript
class I18nProvider {
  constructor(locale, translations) {
    this.locale = locale;
    this.translations = translations;
    this.fallbackLocale = 'en';
  }
  
  t(key, params = {}) {
    const keys = key.split('.');
    let message = this.translations[this.locale];
    
    for (const k of keys) {
      message = message?.[k] || this.translations[this.fallbackLocale]?.[k];
    }
    
    if (!message) return key;
    
    return this.interpolate(message, params);
  }
  
  interpolate(message, params) {
    return message.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key] !== undefined ? params[key] : `{${key}}`;
    });
  }
  
  formatDate(date, options = {}) {
    const localeDate = new Date(date);
    return new Intl.DateTimeFormat(this.locale, {
      dateStyle: 'medium',
      ...options
    }).format(localeDate);
  }
  
  formatNumber(number, options = {}) {
    return new Intl.NumberFormat(this.locale, {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(number);
  }
  
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency
    }).format(amount);
  }
}
```

### ICU Message Formatter
```javascript
class MessageFormatter {
  constructor(locale) {
    this.locale = locale;
    this.plurals = {
      en: (n) => n === 1 ? 'one' : 'other',
      zh: () => 'other',
      ar: (n) => {
        if (n === 0) return 'zero';
        if (n === 1) return 'one';
        if (n === 2) return 'two';
        if (n % 100 >= 3 && n % 100 <= 10) return 'few';
        if (n % 100 >= 11) return 'many';
        return 'other';
      }
    };
  }
  
  format(message, params) {
    return message.replace(/\{(\w+)(,\s*\w+(?:,\s*[^}]+)?)?\}/g, (match, key, rest) => {
      const value = params[key];
      if (value === undefined) return match;
      
      const pluralFn = this.plurals[this.locale] || this.plurals.en;
      
      if (!rest) return value;
      
      const [, type, options] = rest.match(/,(\w+)(?:,\s*([^}]+))?/) || [];
      
      switch (type) {
        case 'plural':
          const category = pluralFn(value);
          const optionMatch = options?.match(new RegExp(`${category}\\s*\\{([^}]+)\\}`));
          return optionMatch ? optionMatch[1] : options.split(',').pop();
        case 'select':
          const selectMatch = options?.match(new RegExp(`${value}\\s*\\{([^}]+)\\}`));
          return selectMatch ? selectMatch[1] : '';
        default:
          return value;
      }
    });
  }
}

// Usage
const formatter = new MessageFormatter('en');
const message = formatter.format(
  '{count, plural, one {# item} other {# items}}',
  { count: 5 }
);
```

### RTL Layout Manager
```javascript
class RTLManager {
  constructor() {
    this.supportedRTL = ['ar', 'he', 'fa', 'ur'];
    this.currentDir = 'ltr';
  }
  
  detectLocale(locale) {
    const baseLocale = locale.split('-')[0];
    return this.supportedRTL.includes(baseLocale) ? 'rtl' : 'ltr';
  }
  
  applyDirection(locale) {
    const dir = this.detectLocale(locale);
    this.currentDir = dir;
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }
  
  flipStyles(styles) {
    if (this.currentDir !== 'rtl') return styles;
    
    const flipMap = {
      'margin-left': 'margin-right',
      'margin-right': 'margin-left',
      'padding-left': 'padding-right',
      'padding-right': 'padding-left',
      'border-left': 'border-right',
      'border-right': 'border-left',
      'left': 'right',
      'right': 'left',
      'text-align-left': 'text-align-right',
      'text-align-right': 'text-align-left'
    };
    
    const flipped = { ...styles };
    Object.entries(styles).forEach(([key, value]) => {
      if (flipMap[key]) {
        flipped[flipMap[key]] = value;
        delete flipped[key];
      }
    });
    return flipped;
  }
  
  getStartEnd() {
    return this.currentDir === 'rtl' 
      ? { start: 'right', end: 'left' }
      : { start: 'left', end: 'right' };
  }
}
```

## Best Practices

1. Externalize all user-facing strings from the beginning
2. Use locale-aware formatting libraries (Intl API, i18next, react-intl)
3. Design for text expansion (languages can be 300% longer)
4. Test with pseudo-localization before real translations
5. Support RTL languages from the start, not as an afterthought
6. Store translations in structured files (JSON, YAML, XLIFF)
7. Use ICU MessageFormat for complex pluralization and gender
8. Consider date, time, number, and currency formatting per locale
9. Maintain separate translation memories for consistency
10. Involve native speakers in translation review
