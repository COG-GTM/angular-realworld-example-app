import { marked } from 'marked';

/**
 * Renders markdown to an HTML string. Mirrors Angular's MarkdownPipe.
 * `marked` already escapes/sanitizes HTML output by default.
 */
export async function renderMarkdown(content: string): Promise<string> {
  return marked.parse(content ?? '');
}
