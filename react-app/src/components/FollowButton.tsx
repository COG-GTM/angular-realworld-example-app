import { useState } from 'react';
import { Profile } from '../models';
import { Profiles } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FollowButtonProps {
  profile: Profile;
  onToggle?: (profile: Profile) => void;
}

export function FollowButton({ profile, onToggle }: FollowButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (profile.following) {
        const updated = await Profiles.unfollow(profile.username);
        onToggle?.(updated);
      } else {
        const updated = await Profiles.follow(profile.username);
        onToggle?.(updated);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm action-btn ${profile.following ? 'btn-secondary' : 'btn-outline-secondary'}`}
      onClick={handleClick}
      disabled={submitting}
    >
      <i className="ion-plus-round"></i>&nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
