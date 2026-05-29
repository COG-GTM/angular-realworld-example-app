import DOMPurify from 'dompurify';
import { marked } from 'marked';

export async function renderMarkdown(content: string): Promise<string> {
  const raw = await marked.parse(content);
  return DOMPurify.sanitize(raw);
}
