import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Replaces the Angular `MarkdownPipe` (marked + Angular `DomSanitizer`). Parses
 * markdown to HTML and sanitizes it with DOMPurify to strip XSS vectors before
 * it is injected via `dangerouslySetInnerHTML`.
 */
export async function markdownToHtml(content: string): Promise<string> {
  const rawHtml = await marked.parse(content ?? '');
  return DOMPurify.sanitize(rawHtml);
}
