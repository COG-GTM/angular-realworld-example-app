import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profilesApi } from '../api/services';
import { useUser } from '../context/UserContext';
import type { Profile } from '../types';

export function FollowButton({ profile, onToggle }: { profile: Profile; onToggle: (profile: Profile) => void }) {
  const { authState } = useUser();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = async () => {
    if (authState !== 'authenticated') {
      navigate('/register');
      return;
    }
    setIsSubmitting(true);
    try {
      const { profile: updated } = profile.following
        ? await profilesApi.unfollow(profile.username)
        : await profilesApi.follow(profile.username);
      onToggle(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm action-btn ${profile.following ? 'btn-secondary' : 'btn-outline-secondary'}`}
      disabled={isSubmitting}
      onClick={toggle}
    >
      <i className="ion-plus-round"></i>
      &nbsp; {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}
