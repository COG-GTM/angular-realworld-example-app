/**
 * Replaces the Angular `DefaultImagePipe`: falls back to the bundled default
 * avatar when an image URL is missing.
 */
export function defaultImage(image: string | null | undefined): string {
  return image || '/assets/default-avatar.svg';
}
