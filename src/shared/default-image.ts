/**
 * Returns the given image URL, or the default avatar when it is null/empty.
 * Replaces the Angular `defaultImage` pipe.
 */
export function defaultImage(image: string | null | undefined): string {
  return image || '/assets/default-avatar.svg';
}
