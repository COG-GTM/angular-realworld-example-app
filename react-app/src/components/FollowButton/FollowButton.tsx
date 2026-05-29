import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { followUser, unfollowUser } from '../../services/profile.service';
import type { Profile } from '../../types';

interface Props {
  profile: Profile;
  onToggle: (profile: Profile) => void;
}

export function FollowButton({ profile, onToggle }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = profile.following
        ? await unfollowUser(profile.username)
        : await followUser(profile.username);
      onToggle(updated);
    } catch {
      // API error — button re-enables, user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm action-btn ${profile.following ? 'btn-secondary' : 'btn-outline-secondary'}${isSubmitting ? ' disabled' : ''}`}
      onClick={handleClick}
      disabled={isSubmitting}
    >
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
