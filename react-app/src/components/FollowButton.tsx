import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../types';
import { profilesApi } from '../api/profiles';
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
        ? await profilesApi.follow(profile.username)
        : await profilesApi.unfollow(profile.username);
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
