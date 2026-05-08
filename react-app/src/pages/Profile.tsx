import { useState, useEffect } from 'react';
import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Profile as ProfileModel } from '../models';
import { Profiles } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FollowButton } from '../components/FollowButton';

const DEFAULT_IMAGE = 'https://api.realworld.io/images/smiley-cyrus.jpeg';

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileModel | null>(null);

  useEffect(() => {
    let stale = false;
    if (!username) return;
    Profiles.get(username)
      .then((data) => { if (!stale) setProfile(data); })
      .catch(() => { if (!stale) navigate('/'); });
    return () => { stale = true; };
  }, [username, navigate]);

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  const isOwnProfile = user?.username === profile.username;

  const handleFollowToggle = (updated: ProfileModel) => {
    setProfile(updated);
  };

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img
                src={profile.image || DEFAULT_IMAGE}
                className="user-img"
                alt={profile.username}
              />
              <h4>{profile.username}</h4>
              <p>{profile.bio ?? ''}</p>
              {isOwnProfile ? (
                <button
                  className="btn btn-sm btn-outline-secondary action-btn"
                  onClick={() => navigate('/settings')}
                >
                  <i className="ion-gear-a"></i>&nbsp;Edit Profile Settings
                </button>
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
                  <NavLink
                    className="nav-link"
                    to={`/profile/${profile.username}`}
                    end
                  >
                    My Posts
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to={`/profile/${profile.username}/favorites`}
                  >
                    Favorited Posts
                  </NavLink>
                </li>
              </ul>
            </div>

            <Outlet context={{ username: profile.username }} />
          </div>
        </div>
      </div>
    </div>
  );
}
