import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Renders markdown to sanitized HTML. Mirrors the Angular MarkdownPipe which
 * parsed with `marked` and sanitized via Angular's DomSanitizer.
 */
export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { async: false });
  return DOMPurify.sanitize(html);
}
