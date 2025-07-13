/**
 * Regex patterns for template processing operations.
 * Contains patterns for parsing and processing template strings.
 */
export class TemplatePatterns {
  /**
   * Matches template placeholders in {{variable}} format
   * Captures the variable name in group 1
   * Used for processing Handlebars-style templates
   */
  static readonly PLACEHOLDER = /\{\{(\w+)\}\}/g;
}
