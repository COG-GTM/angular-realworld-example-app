import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profilesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../models';

export function FollowButton({ profile, onToggle }: { profile: Profile; onToggle: (profile: Profile) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const toggleFollowing = async () => {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const updated = profile.following
        ? await profilesApi.unfollow(profile.username)
        : await profilesApi.follow(profile.username);
      setIsSubmitting(false);
      onToggle(updated);
    } catch {
      setIsSubmitting(false);
    }
  };

  const buttonClass = [
    'btn',
    'btn-sm',
    'action-btn',
    isSubmitting ? 'disabled' : '',
    profile.following ? 'btn-secondary' : 'btn-outline-secondary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <app-follow-button>
      <button className={buttonClass} onClick={() => void toggleFollowing()}>
        <i className="ion-plus-round"></i> &nbsp; {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
      </button>
    </app-follow-button>
  );
}
