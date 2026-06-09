import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../types';
import { profileService } from '../services/profile';
import { useAuth } from '../context/AuthContext';

/**
 * Follow/unfollow toggle. Redirects unauthenticated users to /login.
 * Emits the updated profile via `onToggle`.
 */
export function FollowButton({ profile, onToggle }: { profile: Profile; onToggle: (profile: Profile) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const toggleFollowing = async () => {
    if (!isAuthenticated) {
      void navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = !profile.following
        ? await profileService.follow(profile.username)
        : await profileService.unfollow(profile.username);
      onToggle(updated);
    } finally {
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
