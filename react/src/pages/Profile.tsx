import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useParams } from 'react-router-dom';
import { profilesApi } from '../api/services';
import { defaultImage } from '../components/assets';
import { ArticleList } from '../components/ArticleList';
import { FollowButton } from '../components/FollowButton';
import { useUser } from '../context/UserContext';
import type { ArticleListConfig, Profile as ProfileModel } from '../types';

export function Profile() {
  const { username } = useParams();
  const location = useLocation();
  const { user } = useUser();
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [notFound, setNotFound] = useState(false);

  const isFavorites = location.pathname.endsWith('/favorites');
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setProfile(null);
    setNotFound(false);
    profilesApi
      .get(username)
      .then(({ profile }) => {
        if (!cancelled) setProfile(profile);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const config: ArticleListConfig = useMemo(
    () => ({
      type: 'all',
      filters: isFavorites ? { favorited: username } : { author: username },
    }),
    [username, isFavorites],
  );

  if (notFound) {
    return (
      <div className="profile-page">
        <div className="container page">Profile not found.</div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="profile-page">
        <div className="container page">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img src={defaultImage(profile.image)} className="user-img" alt={profile.username} />
              <h4>{profile.username}</h4>
              <p>{profile.bio}</p>
              {isOwnProfile ? (
                <Link to="/settings" className="btn btn-sm btn-outline-secondary action-btn">
                  <i className="ion-gear-a"></i> Edit Profile Settings
                </Link>
              ) : (
                <FollowButton profile={profile} onToggle={setProfile} />
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
                  <NavLink className="nav-link" to={`/profile/${profile.username}`} end>
                    My Articles
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to={`/profile/${profile.username}/favorites`}>
                    Favorited Articles
                  </NavLink>
                </li>
              </ul>
            </div>

            <ArticleList config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}
