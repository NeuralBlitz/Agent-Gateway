/** Enterprise Input Sanitizer — XSS, SQL injection, path traversal prevention */
export class InputSanitizer {
  static sanitizeHtml(input: string): string {
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
  }
  static sanitizePath(input: string): string {
    return input.replace(/\.\./g, '').replace(/\\/g, '/').replace(/[^a-zA-Z0-9_\-./]/g, '');
  }
  static sanitizeSql(input: string): string {
    return input.replace(/['";\\]/g, '').replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|UNION|SELECT)\b/gi, '');
  }
  static sanitizeCommand(input: string): string {
    return input.replace(/[;&|`$(){}[\]!#~]/g, '');
  }
  static sanitizeUrl(input: string): string {
    try { const url = new URL(input); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }
  static sanitizeObject<T extends Record<string, any>>(obj: T, rules: Record<string, 'html' | 'path' | 'sql' | 'command' | 'url'>): T {
    const result = { ...obj } as Record<string, any>;
    for (const [key, type] of Object.entries(rules)) {
      if (typeof result[key] === 'string') {
        switch (type) {
          case 'html': result[key] = this.sanitizeHtml(result[key]); break;
          case 'path': result[key] = this.sanitizePath(result[key]); break;
          case 'sql': result[key] = this.sanitizeSql(result[key]); break;
          case 'command': result[key] = this.sanitizeCommand(result[key]); break;
          case 'url': result[key] = this.sanitizeUrl(result[key]); break;
        }
      }
    }
    return result as T;
  }
}
