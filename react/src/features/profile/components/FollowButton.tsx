// STUB — owned by the "profile" child session. Cross-boundary contract: keep these props stable.
import type { Profile } from '../../../types';
export interface FollowButtonProps {
  profile: Profile;
  onToggle: (profile: Profile) => void;
}
export function FollowButton(_props: FollowButtonProps) {
  return <button className="btn btn-sm" />;
}
