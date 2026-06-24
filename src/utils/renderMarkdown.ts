export async function renderMarkdown(content: string): Promise<string> {
  const { marked } = await import('marked');
  return marked.parse(content) as string;
}
