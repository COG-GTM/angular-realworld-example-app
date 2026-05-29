const DEFAULT_AVATAR = '/assets/default-avatar.svg';

export function defaultImage(image: string | null | undefined): string {
  return image || DEFAULT_AVATAR;
}
