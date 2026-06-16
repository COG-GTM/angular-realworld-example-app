/**
 * Returns a usable avatar URL, falling back to the bundled default avatar when the
 * image is null/empty. (RealWorld e2e contract: avatar `src` must contain
 * `default-avatar.svg` when a user has no image.)
 */
export function defaultImage(image: string | null | undefined): string {
  return image || '/assets/default-avatar.svg';
}
