import { Profile } from '../models/profile';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { followUser, unfollowUser } from '../services/profile.service';

interface Props {
  profile: Profile;
  onToggle: (profile: Profile) => void;
}

function FollowButton({ profile, onToggle }: Props) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const updated = profile.following
        ? await unfollowUser(profile.username)
        : await followUser(profile.username);
      onToggle(updated);
    } catch (e) {
      console.error('Failed to toggle follow:', e);
    }
  };

  const btnClass = profile.following
    ? 'btn btn-sm btn-secondary action-btn'
    : 'btn btn-sm btn-outline-secondary action-btn';

  return (
    <button className={btnClass} onClick={handleClick}>
      <i className="ion-plus-round" />&nbsp;
      {profile.following ? 'Unfollow' : 'Follow'} {profile.username}
    </button>
  );
}

export default FollowButton;
