import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { followUser, unfollowUser } from '../api';

interface FollowButtonProps {
  profile: Profile;
  onToggle: (profile: Profile) => void;
}

export function FollowButton({ profile, onToggle }: FollowButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = profile.following ? await unfollowUser(profile.username) : await followUser(profile.username);
      onToggle(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  const btnClass = [
    'btn btn-sm action-btn',
    isSubmitting ? 'disabled' : '',
    profile.following ? 'btn-secondary' : 'btn-outline-secondary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={btnClass} onClick={handleClick}>
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
