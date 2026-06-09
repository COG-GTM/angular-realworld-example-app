import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Default avatar fallback. Port of Angular's DefaultImagePipe.
 */
export function defaultImage(image: string | null | undefined): string {
  return image || '/assets/default-avatar.svg';
}

/**
 * Format a date the way Angular's DatePipe did in the templates.
 * - 'longDate' → e.g. "January 1, 2020"
 * - 'yyyy'     → e.g. "2020"
 */
export function formatDate(value: string | number | Date, format: 'longDate' | 'yyyy'): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return '';
  }
  if (format === 'yyyy') {
    return String(date.getFullYear());
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Render markdown to sanitized HTML. Port of Angular's MarkdownPipe
 * (marked + DomSanitizer).
 */
export async function renderMarkdown(content: string): Promise<string> {
  const html = await marked.parse(content ?? '');
  return DOMPurify.sanitize(html);
}
