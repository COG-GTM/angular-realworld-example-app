import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { profileService } from '../../../services/profile.service';
import type { Profile } from '../../../models/profile.model';

export function FollowButton({ profile, onToggle }: { profile: Profile; onToggle: (profile: Profile) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = profile.following
        ? await profileService.unfollow(profile.username)
        : await profileService.follow(profile.username);
      onToggle(updated);
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm action-btn ${profile.following ? 'btn-secondary' : 'btn-outline-secondary'} ${isSubmitting ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={isSubmitting}
    >
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
