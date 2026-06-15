/**
 * Returns a fallback avatar when an image URL is missing. Mirrors Angular's
 * DefaultImagePipe.
 */
export function defaultImage(image: string | null | undefined): string {
  return image || '/assets/default-avatar.svg';
}
