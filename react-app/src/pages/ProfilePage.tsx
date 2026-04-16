import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Profile } from '../models/profile';
import { ArticleListConfig } from '../models/article';
import { getProfile } from '../services/profile.service';
import { useAuth } from '../context/AuthContext';
import FollowButton from '../components/FollowButton';
import ArticleList from '../components/ArticleList';

function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const isFavorites = location.pathname.endsWith('/favorites');
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    if (username) {
      setLoading(true);
      getProfile(username)
        .then((p) => { setProfile(p); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [username]);

  useEffect(() => { setCurrentPage(1); }, [isFavorites]);

  const handleFollowToggle = useCallback((p: Profile) => {
    setProfile(p);
  }, []);

  if (loading) return <div className="profile-page"><div className="container">Loading...</div></div>;
  if (!profile) return <div className="profile-page"><div className="container">Profile not found</div></div>;

  const defaultImage = '/default-avatar.svg';

  const listConfig: ArticleListConfig = isFavorites
    ? { type: 'all', filters: { favorited: username } }
    : { type: 'all', filters: { author: username } };

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img src={profile.image || defaultImage} className="user-img" alt={profile.username} />
              <h4>{profile.username}</h4>
              {profile.bio && <p>{profile.bio}</p>}
              {isOwnProfile ? (
                <Link to="/settings" className="btn btn-sm btn-outline-secondary action-btn">
                  <i className="ion-gear-a" /> Edit Profile Settings
                </Link>
              ) : (
                <FollowButton profile={profile} onToggle={handleFollowToggle} />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <Link className={`nav-link ${!isFavorites ? 'active' : ''}`} to={`/profile/${username}`}>
                    My Articles
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isFavorites ? 'active' : ''}`} to={`/profile/${username}/favorites`}>
                    Favorited Articles
                  </Link>
                </li>
              </ul>
            </div>
            <ArticleList config={listConfig} currentPage={currentPage} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
