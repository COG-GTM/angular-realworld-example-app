import { marked } from 'marked';

const UNSAFE_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];

/**
 * Renders markdown to sanitized HTML, replacing the Angular `markdown` pipe which
 * combined `marked` with Angular's DomSanitizer.
 */
export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { async: false });
  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll(UNSAFE_TAGS.join(',')).forEach(node => node.remove());
  template.content.querySelectorAll('*').forEach(element => {
    for (const attribute of Array.from(element.attributes)) {
      const value = attribute.value.replace(/\s/g, '').toLowerCase();
      if (attribute.name.startsWith('on') || value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return template.innerHTML;
}
