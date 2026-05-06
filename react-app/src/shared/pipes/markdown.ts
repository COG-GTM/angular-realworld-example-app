import { marked } from 'marked';
import DOMPurify from 'dompurify';

export async function renderMarkdown(content: string): Promise<string> {
  const html = await marked.parse(content);
  return DOMPurify.sanitize(html);
}
