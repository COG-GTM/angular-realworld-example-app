import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Render markdown to sanitized HTML. Sanitization mirrors the Angular app's use
 * of DomSanitizer to strip scripts and dangerous attributes from rendered bodies.
 */
export async function renderMarkdown(content: string): Promise<string> {
  const rawHtml = await marked.parse(content ?? '');
  return DOMPurify.sanitize(rawHtml);
}
