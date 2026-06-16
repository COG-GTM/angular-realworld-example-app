import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Renders markdown to sanitized HTML for use with `dangerouslySetInnerHTML`.
 *
 * Replaces the Angular `MarkdownPipe` (marked + DomSanitizer). DOMPurify strips
 * scripts and event-handler attributes so untrusted article bodies can't execute
 * (see the XSS e2e suite). `marked.parse` is forced synchronous.
 */
export function renderMarkdown(content: string): string {
  if (!content) {
    return '';
  }
  const html = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
