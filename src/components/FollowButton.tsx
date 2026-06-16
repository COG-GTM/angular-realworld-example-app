import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../types/profile';
import { profileService } from '../services/profile';
import { useAuth } from '../auth/AuthContext';

export function FollowButton({ profile, onToggle }: { profile: Profile; onToggle: (profile: Profile) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const toggleFollowing = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = !profile.following
        ? await profileService.follow(profile.username)
        : await profileService.unfollow(profile.username);
      onToggle(updated);
    } catch {
      // Swallow errors — the app should not crash on a failed follow toggle.
    } finally {
      setIsSubmitting(false);
    }
  };

  const classNames = [
    'btn',
    'btn-sm',
    'action-btn',
    isSubmitting ? 'disabled' : '',
    profile.following ? 'btn-secondary' : 'btn-outline-secondary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classNames} onClick={toggleFollowing}>
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
