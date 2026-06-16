import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Renders markdown to sanitized HTML. Sanitization (DOMPurify) is required by the
 * RealWorld XSS e2e tests — script tags and event-handler attributes must be stripped.
 */
export function Markdown({ content }: { content: string }) {
  const rawHtml = marked.parse(content ?? '', { async: false }) as string;
  const html = DOMPurify.sanitize(rawHtml);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
