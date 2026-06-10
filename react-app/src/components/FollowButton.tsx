import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../types';
import { useAuth } from '../hooks/useAuth';
import { followUser, unfollowUser } from '../api/profiles';

/**
 * Replaces the Angular `FollowButtonComponent`. Emits the updated profile via
 * `onToggle`. Unauthenticated users are redirected to `/login`.
 */
export function FollowButton({ profile, onToggle }: { profile: Profile; onToggle: (profile: Profile) => void }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFollowing = async () => {
    if (!isAuthenticated) {
      void navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = !profile.following ? await followUser(profile.username) : await unfollowUser(profile.username);
      setIsSubmitting(false);
      onToggle(updated);
    } catch {
      setIsSubmitting(false);
    }
  };

  const classes = [
    'btn',
    'btn-sm',
    'action-btn',
    isSubmitting ? 'disabled' : '',
    profile.following ? 'btn-secondary' : 'btn-outline-secondary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} onClick={toggleFollowing}>
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
