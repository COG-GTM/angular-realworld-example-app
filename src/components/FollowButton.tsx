import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import * as profilesApi from '../api/profiles';
import type { Profile } from '../types/profile';
import { cx } from '../utils/cx';

/**
 * Follow/unfollow toggle. Unauthenticated users are sent to /login.
 * Emits the updated profile via `onToggle`.
 */
export function FollowButton({ profile, onToggle }: { profile: Profile; onToggle: (profile: Profile) => void }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFollowing = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = !profile.following
        ? await profilesApi.follow(profile.username)
        : await profilesApi.unfollow(profile.username);
      onToggle(updated);
    } catch {
      // Swallow: keep the UI responsive on failure (matches Angular behavior).
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={cx('btn', 'btn-sm', 'action-btn', {
        disabled: isSubmitting,
        'btn-outline-secondary': !profile.following,
        'btn-secondary': profile.following,
      })}
      onClick={toggleFollowing}
    >
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
