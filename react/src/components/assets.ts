import defaultAvatar from '../../../realworld/assets/media/default-avatar.svg';
import conduitLogo from '../../../realworld/assets/media/conduit-logo.svg';

export { conduitLogo };

export function defaultImage(image: string | null | undefined): string {
  return image || defaultAvatar;
}
