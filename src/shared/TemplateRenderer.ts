import { TemplatePatterns } from '@/shared/patterns/TemplatePatterns';

export interface TemplateData {
  [key: string]: string;
}

export class TemplateRenderer {
  /**
   * Renders a template by replacing placeholders with data values.
   * Placeholders use the format {{variableName}}
   *
   * @param template - The template string containing placeholders
   * @param data - Object containing key-value pairs for replacement
   * @returns The rendered template with placeholders replaced
   */
  static render(template: string, data: TemplateData): string {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, value);
    }

    return result;
  }

  /**
   * Validates that all required placeholders in the template have corresponding data
   *
   * @param template - The template string to validate
   * @param data - Object containing key-value pairs
   * @returns Array of missing placeholder keys, empty if all are provided
   */
  static validateTemplate(template: string, data: TemplateData): string[] {
    const placeholders = new Set<string>();
    let match;

    while ((match = TemplatePatterns.PLACEHOLDER.exec(template)) !== null) {
      placeholders.add(match[1]);
    }

    const missingKeys: string[] = [];
    for (const placeholder of placeholders) {
      if (!(placeholder in data)) {
        missingKeys.push(placeholder);
      }
    }

    return missingKeys;
  }

  /**
   * Extracts all placeholder names from a template
   *
   * @param template - The template string to analyze
   * @returns Array of unique placeholder names found in the template
   */
  static extractPlaceholders(template: string): string[] {
    const placeholders = new Set<string>();
    let match;

    while ((match = TemplatePatterns.PLACEHOLDER.exec(template)) !== null) {
      placeholders.add(match[1]);
    }

    return Array.from(placeholders);
  }
}
