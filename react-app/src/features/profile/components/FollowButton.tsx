import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../core/auth/services/user.service';
import { ProfileService } from '../services/profile.service';
import type { Profile } from '../models/profile.model';

interface FollowButtonProps {
  profile: Profile;
  onToggle: (profile: Profile) => void;
}

export function FollowButton({ profile, onToggle }: FollowButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  const toggleFollowing = async () => {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const updatedProfile = profile.following
        ? await ProfileService.unfollow(profile.username)
        : await ProfileService.follow(profile.username);
      setIsSubmitting(false);
      onToggle(updatedProfile);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm action-btn ${isSubmitting ? 'disabled' : ''} ${
        profile.following ? 'btn-secondary' : 'btn-outline-secondary'
      }`}
      onClick={toggleFollowing}
      disabled={isSubmitting}
    >
      <i className="ion-plus-round"></i>
      &nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
