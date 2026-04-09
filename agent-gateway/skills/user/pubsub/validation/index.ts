export type ValidationType = 
  | 'required' 
  | 'email' 
  | 'url' 
  | 'min' 
  | 'max' 
  | 'minLength' 
  | 'maxLength' 
  | 'pattern' 
  | 'enum' 
  | 'custom';

export interface ValidationRule {
  type: ValidationType;
  message: string;
  value?: unknown;
  validator?: (value: unknown) => boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  type: ValidationType;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class Validator {
  private rules: Map<string, ValidationRule[]> = new Map();

  addRule(field: string, rule: ValidationRule): this {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
    return this;
  }

  validate(data: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [field, rules] of this.rules) {
      const value = data[field];

      for (const rule of rules) {
        const error = this.validateRule(field, value, rule);
        if (error) {
          errors.push(error);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateRule(field: string, value: unknown, rule: ValidationRule): ValidationError | null {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return { field, message: rule.message, type: rule.type, value };
        }
        break;

      case 'email':
        if (value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { field, message: rule.message, type: rule.type, value };
        }
        break;

      case 'url':
        if (value && typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            return { field, message: rule.message, type: rule.type, value };
          }
        }
        break;

      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          return { field, message: rule.message, type: rule.type, value };
        }
        break;

      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          return { field, message: rule.message, type: rule.type, value };
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          return { field, message: rule.message, type: rule.type, value };
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          return { field, message: rule.message, type: rule.type, value };
        }
        break;

      case 'pattern':
        if (value && typeof value === 'string' && rule.value) {
          const regex = new RegExp(rule.value as string);
          if (!regex.test(value)) {
            return { field, message: rule.message, type: rule.type, value };
          }
        }
        break;

      case 'enum':
        if (value && !(rule.value as unknown[])?.includes(value)) {
          return { field, message: rule.message, type: rule.type, value };
        }
        break;

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return { field, message: rule.message, type: rule.type, value };
        }
        break;
    }

    return null;
  }
}

export function createValidator(): Validator {
  return new Validator();
}

export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message,
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    type: 'email',
    message,
  }),

  url: (message = 'Invalid URL'): ValidationRule => ({
    type: 'url',
    message,
  }),

  min: (value: number, message?: string): ValidationRule => ({
    type: 'min',
    message: message || `Value must be at least ${value}`,
    value,
  }),

  max: (value: number, message?: string): ValidationRule => ({
    type: 'max',
    message: message || `Value must be at most ${value}`,
    value,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'minLength',
    message: message || `Length must be at least ${length}`,
    value: length,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    message: message || `Length must be at most ${length}`,
    value: length,
  }),

  pattern: (regex: string, message = 'Invalid format'): ValidationRule => ({
    type: 'pattern',
    message,
    value: regex,
  }),

  enum: (values: unknown[], message = 'Invalid value'): ValidationRule => ({
    type: 'enum',
    message,
    value: values,
  }),

  custom: (validator: (value: unknown) => boolean, message = 'Invalid value'): ValidationRule => ({
    type: 'custom',
    message,
    validator,
  }),
};
