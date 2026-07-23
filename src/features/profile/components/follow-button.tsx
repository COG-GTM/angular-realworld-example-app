import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../models/profile';
import { useIsAuthenticated } from '../../../core/auth/user-context';
import * as profileService from '../services/profile.service';

export function FollowButton({ profile, onToggle }: { profile: Profile; onToggle: (profile: Profile) => void }) {
  const isAuthenticated = useIsAuthenticated();
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
        ? await profileService.follow(profile.username)
        : await profileService.unfollow(profile.username);
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
