/**
 * Regex patterns for template processing operations.
 * Contains patterns for parsing and processing template strings with various placeholder formats.
 */
export class TemplatePatterns {
  /**
   * Matches template placeholders in {{variable}} format
   * Captures the variable name in group 1
   * Used for processing Handlebars-style templates
   */
  static readonly PLACEHOLDER = /\{\{(\w+)\}\}/g;

  /**
   * Matches template placeholders in ${variable} format
   * Captures the variable name in group 1
   * Used for processing JavaScript template literal style placeholders
   */
  static readonly TEMPLATE_LITERAL = /\$\{(\w+)\}/g;

  /**
   * Matches template placeholders in %variable% format
   * Captures the variable name in group 1
   * Used for processing Windows-style environment variable templates
   */
  static readonly PERCENT_PLACEHOLDER = /%(\w+)%/g;

  /**
   * Matches template placeholders in :variable format
   * Captures the variable name in group 1
   * Used for processing colon-prefixed parameter style templates
   */
  static readonly COLON_PLACEHOLDER = /:(\w+)/g;

  /**
   * Matches any word character sequence that could be a variable name
   * Used for extracting potential variable names from templates
   */
  static readonly VARIABLE_NAME = /\w+/g;
}
