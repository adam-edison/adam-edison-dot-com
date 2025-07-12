import { describe, it, expect } from 'vitest';
import { TemplateRenderer } from '../TemplateRenderer';

describe('TemplateRenderer', () => {
  describe('render', () => {
    it('should replace single placeholder with data value', () => {
      const template = 'Hello {{name}}!';
      const data = { name: 'John' };

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('Hello John!');
    });

    it('should replace multiple placeholders with data values', () => {
      const template = 'Hello {{firstName}} {{lastName}}!';
      const data = { firstName: 'John', lastName: 'Doe' };

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('Hello John Doe!');
    });

    it('should replace the same placeholder multiple times', () => {
      const template = 'Hello {{name}}, welcome {{name}}!';
      const data = { name: 'John' };

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('Hello John, welcome John!');
    });

    it('should leave placeholders unchanged if no data provided', () => {
      const template = 'Hello {{name}}!';
      const data = {};

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('Hello {{name}}!');
    });

    it('should leave placeholders unchanged if key not in data', () => {
      const template = 'Hello {{name}} and {{friend}}!';
      const data = { name: 'John' };

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('Hello John and {{friend}}!');
    });

    it('should handle empty template', () => {
      const template = '';
      const data = { name: 'John' };

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('');
    });

    it('should handle template with no placeholders', () => {
      const template = 'Hello World!';
      const data = { name: 'John' };

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('Hello World!');
    });

    it('should handle empty strings as values', () => {
      const template = 'Hello {{name}}!';
      const data = { name: '' };

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('Hello !');
    });

    it('should handle complex email template', () => {
      const template = `
        <h1>New Message from {{firstName}} {{lastName}}</h1>
        <p>Email: {{email}}</p>
        <p>Message: {{message}}</p>
        <p>Sent: {{timestamp}}</p>
      `;
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        message: 'Hello there!',
        timestamp: '2024-01-01 12:00:00'
      };

      const result = TemplateRenderer.render(template, data);

      expect(result).toContain('New Message from John Doe');
      expect(result).toContain('Email: john@example.com');
      expect(result).toContain('Message: Hello there!');
      expect(result).toContain('Sent: 2024-01-01 12:00:00');
    });

    it('should handle special characters in values', () => {
      const template = 'Message: {{message}}';
      const data = { message: 'Hello & welcome to <our> "website"!' };

      const result = TemplateRenderer.render(template, data);

      expect(result).toBe('Message: Hello & welcome to <our> "website"!');
    });
  });

  describe('validateTemplate', () => {
    it('should return empty array when all placeholders have data', () => {
      const template = 'Hello {{name}} {{surname}}!';
      const data = { name: 'John', surname: 'Doe' };

      const missing = TemplateRenderer.validateTemplate(template, data);

      expect(missing).toEqual([]);
    });

    it('should return missing placeholder names', () => {
      const template = 'Hello {{name}} {{surname}}!';
      const data = { name: 'John' };

      const missing = TemplateRenderer.validateTemplate(template, data);

      expect(missing).toEqual(['surname']);
    });

    it('should return all missing placeholders', () => {
      const template = 'Hello {{name}} {{surname}} from {{city}}!';
      const data = { name: 'John' };

      const missing = TemplateRenderer.validateTemplate(template, data);

      expect(missing).toEqual(['surname', 'city']);
    });

    it('should handle duplicate placeholders correctly', () => {
      const template = 'Hello {{name}}, welcome {{name}} from {{city}}!';
      const data = { name: 'John' };

      const missing = TemplateRenderer.validateTemplate(template, data);

      expect(missing).toEqual(['city']);
    });

    it('should return empty array for template with no placeholders', () => {
      const template = 'Hello World!';
      const data = {};

      const missing = TemplateRenderer.validateTemplate(template, data);

      expect(missing).toEqual([]);
    });

    it('should return empty array for empty template', () => {
      const template = '';
      const data = {};

      const missing = TemplateRenderer.validateTemplate(template, data);

      expect(missing).toEqual([]);
    });
  });

  describe('extractPlaceholders', () => {
    it('should extract single placeholder', () => {
      const template = 'Hello {{name}}!';

      const placeholders = TemplateRenderer.extractPlaceholders(template);

      expect(placeholders).toEqual(['name']);
    });

    it('should extract multiple placeholders', () => {
      const template = 'Hello {{firstName}} {{lastName}}!';

      const placeholders = TemplateRenderer.extractPlaceholders(template);

      expect(placeholders).toEqual(['firstName', 'lastName']);
    });

    it('should extract unique placeholders only', () => {
      const template = 'Hello {{name}}, welcome {{name}}!';

      const placeholders = TemplateRenderer.extractPlaceholders(template);

      expect(placeholders).toEqual(['name']);
    });

    it('should return empty array for template with no placeholders', () => {
      const template = 'Hello World!';

      const placeholders = TemplateRenderer.extractPlaceholders(template);

      expect(placeholders).toEqual([]);
    });

    it('should return empty array for empty template', () => {
      const template = '';

      const placeholders = TemplateRenderer.extractPlaceholders(template);

      expect(placeholders).toEqual([]);
    });

    it('should extract placeholders from complex template', () => {
      const template = `
        <h1>{{title}}</h1>
        <p>From: {{firstName}} {{lastName}} ({{email}})</p>
        <p>{{message}}</p>
        <footer>{{timestamp}}</footer>
      `;

      const placeholders = TemplateRenderer.extractPlaceholders(template);

      expect(placeholders).toEqual(['title', 'firstName', 'lastName', 'email', 'message', 'timestamp']);
    });

    it('should handle placeholders with numbers and underscores', () => {
      const template = 'User: {{user_name_1}} ID: {{user_id_2}}';

      const placeholders = TemplateRenderer.extractPlaceholders(template);

      expect(placeholders).toEqual(['user_name_1', 'user_id_2']);
    });
  });
});
