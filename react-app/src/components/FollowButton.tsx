import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import type { Profile } from '../types';

interface FollowButtonProps {
  profile: Profile;
  onToggle: (profile: Profile) => void;
}

export function FollowButton({ profile, onToggle }: FollowButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const toggleFollowing = async () => {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      void navigate('/login');
      return;
    }

    try {
      const updated = !profile.following
        ? await profileApi.follow(profile.username)
        : await profileApi.unfollow(profile.username);
      setIsSubmitting(false);
      onToggle(updated);
    } catch {
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
