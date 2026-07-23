import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

/**
 * Renders markdown to sanitized HTML. Replaces the Angular `markdown` pipe,
 * using DOMPurify in place of Angular's DomSanitizer.
 */
export async function renderMarkdown(content: string): Promise<string> {
  const { marked } = await import('marked');
  const html = await marked.parse(content ?? '');
  return DOMPurify.sanitize(html);
}

/**
 * Hook that asynchronously renders markdown to sanitized HTML.
 */
export function useMarkdown(content: string | null | undefined): string {
  const [html, setHtml] = useState('');

  useEffect(() => {
    let active = true;
    if (content == null) {
      setHtml('');
      return;
    }
    void renderMarkdown(content).then(result => {
      if (active) {
        setHtml(result);
      }
    });
    return () => {
      active = false;
    };
  }, [content]);

  return html;
}
