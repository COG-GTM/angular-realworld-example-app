import { marked } from 'marked';

// Mirrors Angular's DefaultImagePipe.
export function defaultImage(image: string | null | undefined): string {
  return image || '/assets/default-avatar.svg';
}

// Mirrors Angular's DatePipe 'longDate' format (e.g. "June 23, 2026").
const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export function longDate(value: string): string {
  return longDateFormatter.format(new Date(value));
}

// Mirrors Angular's MarkdownPipe.
export function renderMarkdown(content: string): string {
  return marked.parse(content, { async: false }) as string;
}
