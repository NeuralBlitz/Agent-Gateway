import { describe, it, expect } from 'vitest';
import { InputSanitizer } from '../src/input-sanitizer/index.js';

describe('InputSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(InputSanitizer.sanitizeHtml('<script>alert(1)</script>')).toBe(
        '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
      );
    });

    it('should escape quotes', () => {
      expect(InputSanitizer.sanitizeHtml('"hello\'')).toBe('&quot;hello&#x27;');
    });

    it('should pass plain text unchanged', () => {
      expect(InputSanitizer.sanitizeHtml('hello world')).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(InputSanitizer.sanitizeHtml('')).toBe('');
    });

    it('should escape forward slashes', () => {
      expect(InputSanitizer.sanitizeHtml('</div>')).toBe('&lt;&#x2F;div&gt;');
    });
  });

  describe('sanitizePath', () => {
    it('should remove path traversal attempts', () => {
      expect(InputSanitizer.sanitizePath('../etc/passwd')).toBe('etcpasswd');
      expect(InputSanitizer.sanitizePath('..\\..\\windows')).toBe('windows');
    });

    it('should normalize backslashes to forward slashes', () => {
      expect(InputSanitizer.sanitizePath('folder\\file')).toBe('folder/file');
    });

    it('should remove invalid characters', () => {
      expect(InputSanitizer.sanitizePath('valid_file-name.txt')).toBe('valid_file-name.txt');
      expect(InputSanitizer.sanitizePath('file<name>.txt')).toBe('filename.txt');
    });

    it('should allow safe path characters', () => {
      expect(InputSanitizer.sanitizePath('/usr/local/bin/app')).toBe('/usr/local/bin/app');
    });

    it('should handle empty string', () => {
      expect(InputSanitizer.sanitizePath('')).toBe('');
    });
  });

  describe('sanitizeSql', () => {
    it('should remove SQL dangerous characters', () => {
      expect(InputSanitizer.sanitizeSql("admin'; DROP TABLE users;--")).toBe('admin DROP TABLE users--');
    });

    it('should remove SQL keywords', () => {
      const input = 'SELECT * FROM users WHERE name = test';
      const result = InputSanitizer.sanitizeSql(input);
      expect(result).not.toContain('SELECT');
      expect(result).not.toContain('FROM');
      expect(result).not.toContain('WHERE');
    });

    it('should handle safe input', () => {
      expect(InputSanitizer.sanitizeSql('42')).toBe('42');
      expect(InputSanitizer.sanitizeSql('hello world')).toBe('hello world');
    });

    it('should be case-insensitive for SQL keywords', () => {
      expect(InputSanitizer.sanitizeSql('select')).toBe('');
      expect(InputSanitizer.sanitizeSql('UNION')).toBe('');
      expect(InputSanitizer.sanitizeSql('SeLeCt')).toBe('');
    });

    it('should handle empty string', () => {
      expect(InputSanitizer.sanitizeSql('')).toBe('');
    });

    it('should remove backslashes', () => {
      expect(InputSanitizer.sanitizeSql("test\\value")).toBe('testvalue');
    });
  });

  describe('sanitizeCommand', () => {
    it('should remove command injection characters', () => {
      expect(InputSanitizer.sanitizeCommand('ls; rm -rf /')).toBe('ls rm -rf ');
    });

    it('should remove pipe characters', () => {
      expect(InputSanitizer.sanitizeCommand('cat /etc/passwd | grep root')).toBe('cat etcpasswd  grep root');
    });

    it('should remove backticks and dollar signs', () => {
      expect(InputSanitizer.sanitizeCommand('`whoami`')).toBe('whoami');
      expect(InputSanitizer.sanitizeCommand('$HOME')).toBe('HOME');
    });

    it('should handle safe input', () => {
      expect(InputSanitizer.sanitizeCommand('hello world')).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(InputSanitizer.sanitizeCommand('')).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow http URLs', () => {
      expect(InputSanitizer.sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should allow https URLs', () => {
      expect(InputSanitizer.sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    });

    it('should reject javascript: URLs', () => {
      expect(InputSanitizer.sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should reject data: URLs', () => {
      expect(InputSanitizer.sanitizeUrl('data:text/html,<script>')).toBe('');
    });

    it('should return empty string for invalid URLs', () => {
      expect(InputSanitizer.sanitizeUrl('not a url')).toBe('');
    });

    it('should return empty string for empty input', () => {
      expect(InputSanitizer.sanitizeUrl('')).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize multiple fields by type', () => {
      const result = InputSanitizer.sanitizeObject(
        {
          title: '<script>alert(1)</script>',
          filePath: '../../../etc/passwd',
          searchQuery: "'; DROP TABLE users",
          url: 'javascript:alert(1)',
          safeField: 'hello',
        },
        {
          title: 'html',
          filePath: 'path',
          searchQuery: 'sql',
          url: 'url',
        }
      );

      expect(result.title).not.toContain('<script>');
      expect(result.filePath).not.toContain('..');
      expect(result.searchQuery).not.toContain('DROP');
      expect(result.url).toBe('');
      expect(result.safeField).toBe('hello');
    });

    it('should skip non-string fields', () => {
      const result = InputSanitizer.sanitizeObject(
        { count: 42, active: true },
        { count: 'html', active: 'sql' }
      );

      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
    });

    it('should handle unknown rules gracefully', () => {
      const result = InputSanitizer.sanitizeObject(
        { field: 'value' },
        { field: 'unknown' as any }
      );

      expect(result.field).toBe('value');
    });

    it('should not modify fields not in rules', () => {
      const result = InputSanitizer.sanitizeObject(
        { title: '<b>bold</b>', description: '<i>italic</i>' },
        { title: 'html' }
      );

      expect(result.title).not.toContain('<b>');
      expect(result.description).toBe('<i>italic</i>');
    });
  });
});
