import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../../types';
import { profileService } from '../../services/profiles';
import { useAuth } from '../../context/AuthContext';

interface Props {
  profile: Profile;
  onToggle: (profile: Profile) => void;
}

export function FollowButton({ profile, onToggle }: Props) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFollowing = async () => {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      void navigate('/login');
      return;
    }

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
