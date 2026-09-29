import { inject, Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
})
export class MarkdownPipe implements PipeTransform {
  domSanitizer = inject(DomSanitizer);
  async transform(content: string): Promise<string> {
    const { marked } = await import('marked');
    return this.domSanitizer.sanitize(SecurityContext.HTML, marked.parse(content)) || '';
  }
}
