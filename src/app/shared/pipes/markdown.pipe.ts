import { inject, Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  domSanitizer = inject(DomSanitizer);
  async transform(content: string): Promise<string> {
    const html = marked.parse(content, { async: false }) as string;
    return this.domSanitizer.sanitize(SecurityContext.HTML, html) || '';
  }
}
