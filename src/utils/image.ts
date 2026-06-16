export const DEFAULT_AVATAR = '/assets/default-avatar.svg';

/**
 * Returns the given image URL, or the default avatar when null/empty.
 * Mirrors the Angular `DefaultImagePipe`.
 */
export function defaultImage(image: string | null | undefined): string {
  return image || DEFAULT_AVATAR;
}
